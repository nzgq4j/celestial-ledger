"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, adminRoles } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const models = ["gpt-5-mini", "gpt-5", "gpt-5.1", "gpt-5.2"] as const;

async function audit(
  actorId: string,
  action: string,
  fields: {
    targetUserId?: string;
    settingKey?: string;
    metadata?: Record<string, string | boolean>;
  },
) {
  await createAdminClient()
    .from("admin_audit_log")
    .insert({
      actor_id: actorId,
      action,
      target_user_id: fields.targetUserId,
      setting_key: fields.settingKey,
      metadata: fields.metadata ?? {},
    });
}

function done(notice: string) {
  revalidatePath("/admin");
  revalidatePath("/", "layout");
  redirect(`/admin?notice=${notice}`);
}

export async function updateUserRole(formData: FormData) {
  const actor = await requireAdmin(["site_admin", "user_admin"]);
  const input = z
    .object({
      userId: z.string().uuid(),
      role: z.enum([...adminRoles, "none"]),
    })
    .parse({ userId: formData.get("user_id"), role: formData.get("role") });
  if (input.userId === actor.id && input.role !== "site_admin")
    redirect("/admin?notice=self_role_protected");
  const admin = createAdminClient();
  if (input.role === "none")
    await admin.from("admin_roles").delete().eq("user_id", input.userId);
  else
    await admin.from("admin_roles").upsert({
      user_id: input.userId,
      role: input.role,
      granted_by: actor.id,
      updated_at: new Date().toISOString(),
    });
  await audit(actor.id, "admin.role.updated", {
    targetUserId: input.userId,
    metadata: { role: input.role },
  });
  done("role_updated");
}

export async function updateUserAccess(formData: FormData) {
  const actor = await requireAdmin(["site_admin", "user_admin"]);
  const input = z
    .object({
      userId: z.string().uuid(),
      operation: z.enum(["suspend", "restore"]),
    })
    .parse({
      userId: formData.get("user_id"),
      operation: formData.get("operation"),
    });
  if (input.userId === actor.id)
    redirect("/admin?notice=self_access_protected");
  const { error } = await createAdminClient().auth.admin.updateUserById(
    input.userId,
    { ban_duration: input.operation === "suspend" ? "876000h" : "none" },
  );
  if (error) redirect("/admin?notice=user_update_failed");
  await audit(actor.id, `admin.user.${input.operation}`, {
    targetUserId: input.userId,
  });
  done("user_updated");
}

export async function grantUserCapability(formData: FormData) {
  const actor = await requireAdmin(["site_admin", "user_admin"]);
  const input = z
    .object({
      userId: z.string().uuid(),
      capabilityKeys: z
        .array(z.enum(["birth_profiles.saved", "report.standard_credit"]))
        .min(1),
      allowance: z.union([z.literal(""), z.coerce.number().int().positive()]),
      endsAt: z.union([z.literal(""), z.string().date()]),
    })
    .parse({
      userId: formData.get("user_id"),
      capabilityKeys: formData.getAll("capability_key"),
      allowance: formData.get("allowance"),
      endsAt: formData.get("ends_at"),
    });
  const { error } = await createAdminClient()
    .from("capability_grants")
    .insert(
      input.capabilityKeys.map((capabilityKey) => ({
        user_id: input.userId,
        capability_key: capabilityKey,
        source_type: "administrative",
        source_reference: `admin:${actor.id}`,
        allowance: input.allowance === "" ? null : input.allowance,
        period: "none",
        ends_at: input.endsAt
          ? new Date(`${input.endsAt}T23:59:59.999Z`).toISOString()
          : null,
        priority: 10,
        status: "active",
      })),
    );
  if (error) redirect("/admin?notice=entitlement_failed");
  await audit(actor.id, "admin.entitlement.granted", {
    targetUserId: input.userId,
    settingKey: input.capabilityKeys.join(","),
    metadata: {
      capabilities: input.capabilityKeys.join(","),
      unlimited: input.allowance === "",
    },
  });
  done("entitlement_updated");
}

export async function revokeUserCapability(formData: FormData) {
  const actor = await requireAdmin(["site_admin", "user_admin"]);
  const input = z
    .object({ grantId: z.string().uuid(), userId: z.string().uuid() })
    .parse({
      grantId: formData.get("grant_id"),
      userId: formData.get("user_id"),
    });
  const { error } = await createAdminClient()
    .from("capability_grants")
    .update({ status: "revoked", updated_at: new Date().toISOString() })
    .eq("id", input.grantId)
    .eq("user_id", input.userId)
    .eq("status", "active");
  if (error) redirect("/admin?notice=entitlement_failed");
  await audit(actor.id, "admin.entitlement.revoked", {
    targetUserId: input.userId,
    settingKey: input.grantId,
  });
  done("entitlement_updated");
}

export async function updateAiSettings(formData: FormData) {
  const actor = await requireAdmin(["site_admin"]);
  const value = z
    .object({
      report: z.enum(models),
      interpretation: z.enum(models),
    })
    .parse({
      report: formData.get("report_model"),
      interpretation: formData.get("interpretation_model"),
    });
  await saveSetting(actor.id, "ai.models", value);
  done("ai_updated");
}

export async function updateIntegrationSettings(formData: FormData) {
  const actor = await requireAdmin(["site_admin"]);
  const section = z
    .enum(["recaptcha", "analytics", "search"])
    .parse(formData.get("section"));
  if (section === "recaptcha") {
    const value = {
      enabled: formData.get("enabled") === "on",
      siteKey: z.string().trim().max(200).parse(formData.get("site_key")),
    };
    await saveSetting(actor.id, "security.recaptcha", value);
  } else if (section === "analytics") {
    const measurementId = z
      .string()
      .trim()
      .regex(/^$|^G-[A-Z0-9]+$/)
      .parse(formData.get("measurement_id"));
    await saveSetting(actor.id, "analytics.google", {
      enabled: formData.get("enabled") === "on",
      measurementId,
    });
  } else {
    const verificationToken = z
      .string()
      .trim()
      .max(250)
      .parse(formData.get("verification_token"));
    await saveSetting(actor.id, "search.google", { verificationToken });
  }
  done(`${section}_updated`);
}

export async function updateDiscoverySettings(formData: FormData) {
  const actor = await requireAdmin(["site_admin", "content_admin"]);
  const section = z.enum(["seo", "geo"]).parse(formData.get("section"));
  if (section === "seo") {
    const value = z
      .object({
        title: z.string().trim().min(2).max(80),
        description: z.string().trim().min(20).max(220),
        canonicalBase: z.string().url().max(200),
        indexingEnabled: z.boolean(),
      })
      .parse({
        title: formData.get("title"),
        description: formData.get("description"),
        canonicalBase: formData.get("canonical_base"),
        indexingEnabled: formData.get("indexing_enabled") === "on",
      });
    await saveSetting(actor.id, "seo.defaults", value);
  } else {
    const description = z
      .string()
      .trim()
      .min(20)
      .max(500)
      .parse(formData.get("organization_description"));
    const sameAs = z
      .string()
      .max(2000)
      .parse(formData.get("same_as"))
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => z.string().url().parse(item));
    await saveSetting(actor.id, "geo.defaults", {
      enabled: formData.get("enabled") === "on",
      organizationDescription: description,
      sameAs,
    });
  }
  done(`${section}_updated`);
}

async function saveSetting(
  actorId: string,
  key: string,
  value: Record<string, unknown>,
) {
  const { error } = await createAdminClient()
    .from("site_settings")
    .upsert({
      key,
      value: value as never,
      updated_by: actorId,
      updated_at: new Date().toISOString(),
    });
  if (error) redirect("/admin?notice=settings_failed");
  await audit(actorId, "admin.setting.updated", {
    settingKey: key,
    metadata: { changed: true },
  });
}

const blogSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(140),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().trim().min(20).max(360),
  body: z.string().trim().min(50).max(50000),
  seoTitle: z.string().trim().max(80),
  seoDescription: z.string().trim().max(220),
  status: z.enum(["draft", "published"]),
});

export async function saveBlogPost(formData: FormData) {
  const actor = await requireAdmin(["site_admin", "content_admin"]);
  const input = blogSchema.parse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    seoTitle: formData.get("seo_title"),
    seoDescription: formData.get("seo_description"),
    status: formData.get("status"),
  });
  const now = new Date().toISOString();
  const record = {
    author_id: actor.id,
    author_name: actor.email.split("@")[0] || "Celestial Atlas",
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    body: input.body,
    seo_title: input.seoTitle || null,
    seo_description: input.seoDescription || null,
    status: input.status,
    published_at: input.status === "published" ? now : null,
    updated_at: now,
  };
  const admin = createAdminClient();
  const result = input.id
    ? await admin.from("blog_posts").update(record).eq("id", input.id)
    : await admin.from("blog_posts").insert(record);
  if (result.error) redirect("/admin?notice=blog_save_failed");
  await audit(
    actor.id,
    input.id ? "admin.blog.updated" : "admin.blog.created",
    {
      settingKey: input.slug,
      metadata: { status: input.status },
    },
  );
  revalidatePath("/journal");
  revalidatePath(`/journal/${input.slug}`);
  done("blog_saved");
}

export async function deleteBlogPost(formData: FormData) {
  const actor = await requireAdmin(["site_admin", "content_admin"]);
  const id = z.string().uuid().parse(formData.get("id"));
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_posts")
    .select("slug")
    .eq("id", id)
    .single();
  if (!data) redirect("/admin?notice=blog_delete_failed");
  const { error } = await admin.from("blog_posts").delete().eq("id", id);
  if (error) redirect("/admin?notice=blog_delete_failed");
  await audit(actor.id, "admin.blog.deleted", { settingKey: data.slug });
  revalidatePath("/journal");
  done("blog_deleted");
}

const tarotDeckSchema = z.object({
  id: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(2).max(80),
  tagline: z.string().trim().min(10).max(240),
  accentToken: z.enum(["gold", "copper", "map-cyan", "map-red", "map-chalk"]),
  minimumPlan: z.enum(["free", "personal", "premium"]),
  sortOrder: z.coerce.number().int().min(0).max(1000),
  active: z.boolean(),
  translations: z.object({
    "es-ES": z.object({
      name: z.string().trim().min(2).max(80),
      tagline: z.string().trim().min(10).max(240),
    }),
    "fr-FR": z.object({
      name: z.string().trim().min(2).max(80),
      tagline: z.string().trim().min(10).max(240),
    }),
    "de-DE": z.object({
      name: z.string().trim().min(2).max(80),
      tagline: z.string().trim().min(10).max(240),
    }),
  }),
});

export async function saveTarotDeck(formData: FormData) {
  const actor = await requireAdmin(["site_admin", "content_admin"]);
  const input = tarotDeckSchema.parse({
    id: formData.get("id"),
    name: formData.get("name"),
    tagline: formData.get("tagline"),
    accentToken: formData.get("accent_token"),
    minimumPlan: formData.get("minimum_plan"),
    sortOrder: formData.get("sort_order"),
    active: formData.get("active") === "on",
    translations: {
      "es-ES": {
        name: formData.get("name_es"),
        tagline: formData.get("tagline_es"),
      },
      "fr-FR": {
        name: formData.get("name_fr"),
        tagline: formData.get("tagline_fr"),
      },
      "de-DE": {
        name: formData.get("name_de"),
        tagline: formData.get("tagline_de"),
      },
    },
  });
  const admin = createAdminClient();
  const { data: existing, error: lookupError } = await admin
    .from("tarot_decks")
    .select("id,cover_image_path,card_back_image_path")
    .eq("id", input.id)
    .maybeSingle();
  if (lookupError) redirect("/admin?notice=tarot_save_failed#tarot-decks");
  if (
    input.active &&
    (!existing?.cover_image_path || !existing.card_back_image_path)
  ) {
    redirect("/admin?notice=tarot_images_required#tarot-decks");
  }

  const record = {
    name: input.name,
    tagline: input.tagline,
    accent_token: input.accentToken,
    minimum_plan: input.minimumPlan,
    sort_order: input.sortOrder,
    active: input.active,
    translations: input.translations,
    updated_by: actor.id,
  };
  const result = existing
    ? await admin.from("tarot_decks").update(record).eq("id", input.id)
    : await admin.from("tarot_decks").insert({
        id: input.id,
        ...record,
        created_by: actor.id,
      });
  if (result.error) redirect("/admin?notice=tarot_save_failed#tarot-decks");

  await audit(
    actor.id,
    existing ? "tarot.deck.updated" : "tarot.deck.created",
    {
      settingKey: `tarot.deck.${input.id}`,
      metadata: {
        plan: input.minimumPlan,
        active: input.active,
      },
    },
  );
  revalidatePath("/tarot");
  done("tarot_saved#tarot-decks");
}
