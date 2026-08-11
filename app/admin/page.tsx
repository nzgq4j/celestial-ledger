import Link from "next/link";
import Image from "next/image";
import { AdminThemeToggle } from "@/components/AdminThemeToggle";
import {
  deleteBlogPost,
  saveBlogPost,
  saveTarotDeck,
  updateAiSettings,
  updateDiscoverySettings,
  updateIntegrationSettings,
  updateUserAccess,
  grantUserCapability,
  revokeUserCapability,
  updateUserRole,
} from "@/app/admin/actions";
import { requireAdmin, adminRoles } from "@/lib/admin/auth";
import { getAdminSettings } from "@/lib/admin/settings";
import { createAdminClient } from "@/lib/supabase/admin";
import { TarotDeckArtworkForm } from "@/components/TarotDeckArtworkForm";
import {
  listTarotDeckCardFaceCountsForAdmin,
  signTarotDeckArtworkForAdmin,
} from "@/lib/tarot/decks";
import { tarotCardsForLocale } from "@/lib/tarot/card-locales";
import type { TarotLocale } from "@/lib/tarot/types";
import { getServerTranslationPack } from "@/lib/i18n/server";
import { formatTarotMessage } from "@/lib/tarot/ui-locales";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administration",
  robots: { index: false, follow: false, nocache: true },
};

function translatedDeckField(
  translations: unknown,
  locale: "es-ES" | "fr-FR" | "de-DE",
  field: "name" | "tagline",
) {
  if (!translations || typeof translations !== "object") return "";
  const translation = (translations as Record<string, unknown>)[locale];
  if (!translation || typeof translation !== "object") return "";
  const value = (translation as Record<string, unknown>)[field];
  return typeof value === "string" ? value : "";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const identity = await requireAdmin();
  const pack = await getServerTranslationPack();
  const tarotCopy = pack.messages.tarot;
  const admin = createAdminClient();
  const [
    settings,
    usersResult,
    rolesResult,
    reportsResult,
    postsResult,
    auditResult,
    contactResult,
    grantsResult,
    decksResult,
    params,
  ] = await Promise.all([
    getAdminSettings(),
    admin.auth.admin.listUsers({ page: 1, perPage: 100 }),
    admin.from("admin_roles").select("user_id,role"),
    admin.from("reports").select("id,status", { count: "exact" }),
    admin
      .from("blog_posts")
      .select("id,title,slug,status,updated_at")
      .order("updated_at", { ascending: false }),
    admin
      .from("admin_audit_log")
      .select("id,action,setting_key,created_at")
      .order("created_at", { ascending: false })
      .limit(12),
    admin
      .from("contact_messages")
      .select("id,name,email,reason,message,notification_status,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("capability_grants")
      .select("id,user_id,capability_key,allowance,ends_at,status")
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    admin
      .from("tarot_decks")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    searchParams,
  ]);
  const roleMap = new Map(
    (rolesResult.data ?? []).map((item) => [item.user_id, item.role]),
  );
  const users = usersResult.data.users;
  const grantsByUser = new Map<string, NonNullable<typeof grantsResult.data>>();
  for (const grant of grantsResult.data ?? []) {
    const current = grantsByUser.get(grant.user_id ?? "") ?? [];
    current.push(grant);
    grantsByUser.set(grant.user_id ?? "", current);
  }
  const reports = reportsResult.data ?? [];
  const tarotDecks = await Promise.all(
    (decksResult.data ?? []).map(async (deck) => ({
      ...deck,
      ...(await signTarotDeckArtworkForAdmin(deck)),
    })),
  );
  const tarotCardFaceCounts = decksResult.error
    ? { counts: new Map<string, number>(), error: null }
    : await listTarotDeckCardFaceCountsForAdmin();
  const tarotCardOptions = tarotCardsForLocale(pack.tag as TarotLocale).map(
    (card) => ({
      id: card.id,
      name: card.name,
    }),
  );
  const notices: Record<string, string> = {
    role_updated: "Administrator role updated.",
    user_updated: "User access updated.",
    entitlement_updated: "User entitlement updated.",
    entitlement_failed: "The entitlement could not be updated.",
    ai_updated: "AI model settings updated.",
    recaptcha_updated: "reCAPTCHA settings updated.",
    analytics_updated: "Google Analytics settings updated.",
    search_updated: "Search Console verification updated.",
    seo_updated: "SEO defaults updated.",
    geo_updated: "GEO defaults updated.",
    blog_saved: "Journal post saved.",
    blog_deleted: "Journal post deleted.",
    tarot_saved: tarotCopy.adminSavedNotice,
    tarot_save_failed: tarotCopy.adminSaveFailedNotice,
    tarot_images_required: tarotCopy.adminImagesRequiredNotice,
    settings_failed: "The setting could not be saved.",
    self_role_protected: "You cannot remove your own site-admin role.",
    self_access_protected: "You cannot suspend your own account.",
    forbidden: "Your role does not allow that operation.",
  };
  const notice = params.notice ? notices[params.notice] : undefined;
  const canManageUsers = ["site_admin", "user_admin"].includes(identity.role);
  const canManageContent = ["site_admin", "content_admin"].includes(
    identity.role,
  );
  const canManageSystem = identity.role === "site_admin";
  const reportStatuses = [
    {
      label: "Ready",
      value: reports.filter((report) => report.status === "completed").length,
      tone: "ready",
    },
    {
      label: "Generating",
      value: reports.filter((report) => report.status === "generating").length,
      tone: "generating",
    },
    {
      label: "Queued",
      value: reports.filter((report) => report.status === "queued").length,
      tone: "queued",
    },
    {
      label: "Needs attention",
      value: reports.filter((report) => report.status === "failed").length,
      tone: "failed",
    },
  ];
  const statusTotal = Math.max(
    1,
    reportStatuses.reduce((total, status) => total + status.value, 0),
  );

  return (
    <main className="admin-shell">
      <header className="admin-hero">
        <div>
          <p className="eyebrow">Administration / Dashboard</p>
          <h1>Main dashboard</h1>
          <p>
            A clear view of members, private reports, publishing, and the
            systems that keep the atlas moving.
          </p>
        </div>
        <div className="admin-hero__utilities">
          <nav className="admin-quick-actions" aria-label="Quick actions">
            <a href="#users">Manage users</a>
            <a href="#tarot-decks">{tarotCopy.adminTitle}</a>
            <a href="#journal">New journal entry</a>
          </nav>
          <AdminThemeToggle />
          <div className="admin-identity">
            <span className="admin-identity__avatar" aria-hidden="true">
              {identity.email.slice(0, 1).toUpperCase()}
            </span>
            <span>
              <strong>{identity.email}</strong>
              <code>{identity.role.replaceAll("_", " ")}</code>
            </span>
            <Link href="/account" aria-label="Return to account">
              &#8599;
            </Link>
          </div>
        </div>
      </header>
      {notice && (
        <p className="admin-notice" role="status">
          {notice}
        </p>
      )}

      <div className="admin-workspace">
        <aside className="admin-sidebar">
          <div className="admin-sidebar__brand">
            <Image
              src="/celestialatlas-logo.png"
              alt=""
              width={42}
              height={42}
            />
            <span>
              <strong>Celestial Atlas</strong>
              <small>Admin observatory</small>
            </span>
          </div>
          <nav className="admin-rail" aria-label="Administration sections">
            <span>Workspace</span>
            <a href="#overview">Overview</a>
            <a href="#users">People & access</a>
            <span>Operations</span>
            <a href="#ai">AI models</a>
            <a href="#integrations">Integrations</a>
            <a href="#discovery">Discovery</a>
            <span>Publishing</span>
            <a href="#tarot-decks">{tarotCopy.adminTitle}</a>
            <a href="#journal">Journal</a>
            <a href="#contact-messages">Contact</a>
            <a href="#audit">Audit trail</a>
          </nav>
          <div className="admin-sidebar__status">
            <span className="admin-status-dot" />
            <div>
              <strong>Production</strong>
              <small>Private control room</small>
            </div>
          </div>
        </aside>
        <div className="admin-main">
          <section className="admin-section" id="overview">
            <div className="admin-section__heading">
              <p className="eyebrow">System chart</p>
              <h2>Operational overview</h2>
            </div>
            <div className="admin-metrics">
              <article>
                <span className="admin-metric__icon" aria-hidden="true">
                  &#9678;
                </span>
                <span>Registered users</span>
                <strong>{users.length}</strong>
                <small>First 100 accounts</small>
              </article>
              <article>
                <span className="admin-metric__icon" aria-hidden="true">
                  &#10022;
                </span>
                <span>Private reports</span>
                <strong>{reportsResult.count ?? reports.length}</strong>
                <small>
                  {reports.filter((r) => r.status === "completed").length} ready
                  in current result
                </small>
              </article>
              <article>
                <span className="admin-metric__icon" aria-hidden="true">
                  &#9671;
                </span>
                <span>Administrators</span>
                <strong>{roleMap.size}</strong>
                <small>Role-assigned accounts</small>
              </article>
              <article>
                <span className="admin-metric__icon" aria-hidden="true">
                  &#9998;
                </span>
                <span>Published entries</span>
                <strong>
                  {
                    (postsResult.data ?? []).filter(
                      (p) => p.status === "published",
                    ).length
                  }
                </strong>
                <small>Public journal</small>
              </article>
            </div>
            <div className="admin-overview-grid">
              <article className="admin-report-pulse">
                <header>
                  <div>
                    <span>Generation health</span>
                    <h3>Private report pipeline</h3>
                  </div>
                  <strong>{reportsResult.count ?? reports.length}</strong>
                </header>
                <div className="admin-pipeline" aria-label="Report statuses">
                  {reportStatuses.map((status) => (
                    <div className="admin-pipeline__row" key={status.label}>
                      <span>{status.label}</span>
                      <div>
                        <i
                          className={`admin-pipeline__bar admin-pipeline__bar--${status.tone}`}
                          style={{
                            width: `${Math.max(status.value ? 6 : 0, (status.value / statusTotal) * 100)}%`,
                          }}
                        />
                      </div>
                      <strong>{status.value}</strong>
                    </div>
                  ))}
                </div>
              </article>
              <article className="admin-overview-activity">
                <header>
                  <div>
                    <span>Control-room activity</span>
                    <h3>Recent changes</h3>
                  </div>
                  <a href="#audit">View audit trail</a>
                </header>
                <ol>
                  {(auditResult.data ?? []).slice(0, 5).map((item) => (
                    <li key={item.id}>
                      <i aria-hidden="true" />
                      <span>
                        <strong>{item.action.replaceAll("_", " ")}</strong>
                        <small>{item.setting_key ?? "System setting"}</small>
                      </span>
                      <time>
                        {new Date(item.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </time>
                    </li>
                  ))}
                  {!auditResult.data?.length && (
                    <li className="admin-overview-activity__empty">
                      No privileged changes recorded yet.
                    </li>
                  )}
                </ol>
              </article>
            </div>
          </section>

          <section className="admin-section" id="users">
            <div className="admin-section__heading">
              <p className="eyebrow">Access ledger</p>
              <h2>User management</h2>
            </div>
            <div className="admin-user-table" role="table" aria-label="Users">
              {users.map((user) => {
                const role = roleMap.get(user.id) ?? "none";
                const suspended = Boolean(
                  user.banned_until && new Date(user.banned_until) > new Date(),
                );
                return (
                  <article className="admin-user-row" key={user.id} role="row">
                    <div>
                      <strong>{user.email}</strong>
                      <small>
                        Joined{" "}
                        {new Date(user.created_at).toLocaleDateString("en-GB")}
                      </small>
                    </div>
                    <form action={updateUserRole} className="admin-role-form">
                      <input type="hidden" name="user_id" value={user.id} />
                      <select
                        name="role"
                        defaultValue={role}
                        disabled={!canManageUsers}
                      >
                        <option value="none">Member</option>
                        {adminRoles.map((item) => (
                          <option key={item} value={item}>
                            {item.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                      <button
                        disabled={!canManageUsers}
                        className="admin-action admin-action--save"
                      >
                        <span aria-hidden="true">&#10003;</span>
                        Save role
                      </button>
                    </form>
                    <form
                      action={updateUserAccess}
                      className="admin-access-form"
                    >
                      <input type="hidden" name="user_id" value={user.id} />
                      <input
                        type="hidden"
                        name="operation"
                        value={suspended ? "restore" : "suspend"}
                      />
                      <button
                        disabled={!canManageUsers || user.id === identity.id}
                        className={`admin-action ${suspended ? "admin-action--restore" : "admin-action--danger"}`}
                      >
                        <span aria-hidden="true">
                          {suspended ? "\u21ba" : "\u2298"}
                        </span>
                        {suspended ? "Restore" : "Suspend"}
                      </button>
                    </form>
                    <div className="admin-entitlements">
                      {(grantsByUser.get(user.id) ?? []).map((grant) => (
                        <form action={revokeUserCapability} key={grant.id}>
                          <input
                            type="hidden"
                            name="grant_id"
                            value={grant.id}
                          />
                          <input type="hidden" name="user_id" value={user.id} />
                          <span>
                            {grant.capability_key === "birth_profiles.saved"
                              ? "Natal charts"
                              : grant.capability_key ===
                                  "report.standard_credit"
                                ? "Reports"
                                : grant.capability_key}{" "}
                            · {grant.allowance ?? "unlimited"}
                            {grant.ends_at
                              ? ` · until ${new Date(grant.ends_at).toLocaleDateString("en-GB")}`
                              : ""}
                          </span>
                          <button
                            className="admin-action admin-action--revoke"
                            disabled={!canManageUsers}
                          >
                            <span aria-hidden="true">\u00d7</span>
                            Revoke
                          </button>
                        </form>
                      ))}
                      <form action={grantUserCapability}>
                        <input type="hidden" name="user_id" value={user.id} />
                        <fieldset className="admin-entitlement-options">
                          <legend>Grant access to</legend>
                          <label>
                            <input
                              type="checkbox"
                              name="capability_key"
                              value="birth_profiles.saved"
                              disabled={!canManageUsers}
                            />
                            <span>Natal charts</span>
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              name="capability_key"
                              value="report.standard_credit"
                              disabled={!canManageUsers}
                            />
                            <span>Reports</span>
                          </label>
                        </fieldset>
                        <input
                          name="allowance"
                          type="number"
                          min="1"
                          placeholder="Unlimited"
                        />
                        <input name="ends_at" type="date" />
                        <button
                          className="admin-action admin-action--grant"
                          disabled={!canManageUsers}
                        >
                          <span aria-hidden="true">+</span>
                          Grant entitlement
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="admin-section admin-grid" id="ai">
            <div className="admin-section__heading">
              <p className="eyebrow">Generation engines</p>
              <h2>AI model selection</h2>
              <p>
                Models are read at generation time. API credentials remain in
                Vercel.
              </p>
            </div>
            <form className="admin-form" action={updateAiSettings}>
              <label>
                Private report model
                <select name="report_model" defaultValue={settings.ai.report}>
                  {["gpt-5-mini", "gpt-5", "gpt-5.1", "gpt-5.2"].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label>
                Chart interpretation model
                <select
                  name="interpretation_model"
                  defaultValue={settings.ai.interpretation}
                >
                  {["gpt-5-mini", "gpt-5", "gpt-5.1", "gpt-5.2"].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
              <button className="button-primary" disabled={!canManageSystem}>
                Save model settings
              </button>
            </form>
          </section>

          <section className="admin-section" id="integrations">
            <div className="admin-section__heading">
              <p className="eyebrow">External instruments</p>
              <h2>Google and security integrations</h2>
              <p>
                Only public identifiers are stored here. Secret keys remain in
                the deployment secret store.
              </p>
            </div>
            <div className="admin-card-grid">
              <form className="admin-form" action={updateIntegrationSettings}>
                <input type="hidden" name="section" value="recaptcha" />
                <h3>Google reCAPTCHA</h3>
                <p className="integration-state">
                  Secret:{" "}
                  {process.env.RECAPTCHA_SECRET_KEY
                    ? "configured"
                    : "not configured"}
                </p>
                {!process.env.RECAPTCHA_SECRET_KEY && (
                  <p className="integration-state">
                    Add RECAPTCHA_SECRET_KEY to the Vercel environment before
                    enabling protection.
                  </p>
                )}
                <label className="admin-check">
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={settings.recaptcha.enabled}
                  />{" "}
                  Enable protection
                </label>
                <label>
                  Site key
                  <input
                    name="site_key"
                    defaultValue={settings.recaptcha.siteKey}
                  />
                </label>
                <button className="button-primary" disabled={!canManageSystem}>
                  Save reCAPTCHA
                </button>
              </form>
              <form className="admin-form" action={updateIntegrationSettings}>
                <input type="hidden" name="section" value="analytics" />
                <h3>Google Analytics 4</h3>
                <label className="admin-check">
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={settings.analytics.enabled}
                  />{" "}
                  Load analytics
                </label>
                <label>
                  Measurement ID
                  <input
                    name="measurement_id"
                    placeholder="G-XXXXXXXXXX"
                    defaultValue={settings.analytics.measurementId}
                  />
                </label>
                <button className="button-primary" disabled={!canManageSystem}>
                  Save analytics
                </button>
              </form>
              <form className="admin-form" action={updateIntegrationSettings}>
                <input type="hidden" name="section" value="search" />
                <h3>Google Search Console</h3>
                <label>
                  HTML verification token
                  <input
                    name="verification_token"
                    defaultValue={settings.search.verificationToken}
                  />
                </label>
                <p className="integration-state">
                  Emits the google-site-verification meta tag.
                </p>
                <button className="button-primary" disabled={!canManageSystem}>
                  Save verification
                </button>
              </form>
            </div>
          </section>

          <section className="admin-section" id="discovery">
            <div className="admin-section__heading">
              <p className="eyebrow">Discovery map</p>
              <h2>SEO and generative-engine visibility</h2>
            </div>
            <div className="admin-card-grid admin-card-grid--two">
              <form className="admin-form" action={updateDiscoverySettings}>
                <input type="hidden" name="section" value="seo" />
                <h3>Search defaults</h3>
                <label>
                  Site title
                  <input name="title" defaultValue={settings.seo.title} />
                </label>
                <label>
                  Default description
                  <textarea
                    name="description"
                    defaultValue={settings.seo.description}
                  />
                </label>
                <label>
                  Canonical base URL
                  <input
                    name="canonical_base"
                    type="url"
                    defaultValue={settings.seo.canonicalBase}
                  />
                </label>
                <label className="admin-check">
                  <input
                    type="checkbox"
                    name="indexing_enabled"
                    defaultChecked={settings.seo.indexingEnabled}
                  />{" "}
                  Allow public indexing
                </label>
                <button className="button-primary" disabled={!canManageContent}>
                  Save SEO
                </button>
              </form>
              <form className="admin-form" action={updateDiscoverySettings}>
                <input type="hidden" name="section" value="geo" />
                <h3>GEO / answer engines</h3>
                <label className="admin-check">
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={settings.geo.enabled}
                  />{" "}
                  Publish structured organization data
                </label>
                <label>
                  Organization description
                  <textarea
                    name="organization_description"
                    defaultValue={settings.geo.organizationDescription}
                  />
                </label>
                <label>
                  Authority profile URLs <small>One URL per line</small>
                  <textarea
                    name="same_as"
                    defaultValue={settings.geo.sameAs.join("\n")}
                  />
                </label>
                <button className="button-primary" disabled={!canManageContent}>
                  Save GEO
                </button>
              </form>
            </div>
          </section>

          <section className="admin-section" id="tarot-decks">
            <div className="admin-section__heading">
              <p className="eyebrow">{tarotCopy.adminEyebrow}</p>
              <h2>{tarotCopy.adminTitle}</h2>
              <p>{tarotCopy.adminIntroduction}</p>
            </div>

            {decksResult.error ? (
              <p className="admin-empty-state">
                {tarotCopy.adminMigrationPending}
              </p>
            ) : (
              <div className="admin-tarot-layout">
                <form className="admin-form" action={saveTarotDeck}>
                  <h3>{tarotCopy.adminCreateDeck}</h3>
                  <label>
                    {tarotCopy.adminStableId}
                    <small>{tarotCopy.adminStableIdHelp}</small>
                    <input
                      name="id"
                      required
                      minLength={2}
                      maxLength={80}
                      pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    />
                  </label>
                  <label>
                    {tarotCopy.adminName}
                    <input name="name" required minLength={2} maxLength={80} />
                  </label>
                  <label>
                    {tarotCopy.adminTagline}
                    <textarea
                      name="tagline"
                      required
                      minLength={10}
                      maxLength={240}
                    />
                  </label>
                  <fieldset className="admin-localization-fields">
                    <legend>{tarotCopy.adminLocalizedMetadata}</legend>
                    <label>
                      {tarotCopy.adminSpanishName}
                      <input
                        name="name_es"
                        required
                        minLength={2}
                        maxLength={80}
                      />
                    </label>
                    <label>
                      {tarotCopy.adminSpanishTagline}
                      <textarea
                        name="tagline_es"
                        required
                        minLength={10}
                        maxLength={240}
                      />
                    </label>
                    <label>
                      {tarotCopy.adminFrenchName}
                      <input
                        name="name_fr"
                        required
                        minLength={2}
                        maxLength={80}
                      />
                    </label>
                    <label>
                      {tarotCopy.adminFrenchTagline}
                      <textarea
                        name="tagline_fr"
                        required
                        minLength={10}
                        maxLength={240}
                      />
                    </label>
                    <label>
                      {tarotCopy.adminGermanName}
                      <input
                        name="name_de"
                        required
                        minLength={2}
                        maxLength={80}
                      />
                    </label>
                    <label>
                      {tarotCopy.adminGermanTagline}
                      <textarea
                        name="tagline_de"
                        required
                        minLength={10}
                        maxLength={240}
                      />
                    </label>
                  </fieldset>
                  <label>
                    {tarotCopy.adminAccent}
                    <select name="accent_token" defaultValue="gold">
                      <option value="gold">{tarotCopy.adminAccentGold}</option>
                      <option value="copper">
                        {tarotCopy.adminAccentCopper}
                      </option>
                      <option value="map-cyan">
                        {tarotCopy.adminAccentMapCyan}
                      </option>
                      <option value="map-red">
                        {tarotCopy.adminAccentMapRed}
                      </option>
                      <option value="map-chalk">
                        {tarotCopy.adminAccentMapChalk}
                      </option>
                    </select>
                  </label>
                  <label>
                    {tarotCopy.adminMinimumPlan}
                    <select name="minimum_plan" defaultValue="premium">
                      <option value="free">{tarotCopy.adminPlanFree}</option>
                      <option value="personal">
                        {tarotCopy.adminPlanPersonal}
                      </option>
                      <option value="premium">
                        {tarotCopy.adminPlanPremium}
                      </option>
                    </select>
                  </label>
                  <label>
                    {tarotCopy.adminSortOrder}
                    <input
                      name="sort_order"
                      type="number"
                      min={0}
                      max={1000}
                      defaultValue={tarotDecks.length * 10}
                    />
                  </label>
                  <label className="admin-check-row">
                    <input name="active" type="checkbox" />
                    {tarotCopy.adminActivateAfterImages}
                  </label>
                  <button
                    className="button-primary"
                    disabled={!canManageContent}
                  >
                    {tarotCopy.adminCreateAction}
                  </button>
                </form>

                <div className="admin-tarot-decks">
                  {tarotCardFaceCounts.error && (
                    <p className="admin-empty-state">
                      {tarotCopy.adminCardFacesMigrationPending}
                    </p>
                  )}
                  {tarotDecks.map((deck) => {
                    const cardFaceCount =
                      tarotCardFaceCounts.counts.get(deck.id) ?? 0;
                    return (
                      <article className="admin-tarot-deck" key={deck.id}>
                        <header>
                          <div className="admin-tarot-artwork-pair">
                            <div
                              className="admin-tarot-artwork"
                              role={deck.coverImageUrl ? "img" : undefined}
                              aria-label={
                                deck.coverImageUrl
                                  ? formatTarotMessage(
                                      tarotCopy.deckCoverLabel,
                                      {
                                        name: deck.name,
                                      },
                                    )
                                  : undefined
                              }
                              style={
                                deck.coverImageUrl
                                  ? {
                                      backgroundImage: `url("${deck.coverImageUrl}")`,
                                    }
                                  : undefined
                              }
                            >
                              {!deck.coverImageUrl && (
                                <span>{tarotCopy.adminCoverNeeded}</span>
                              )}
                            </div>
                            <div
                              className="admin-tarot-artwork admin-tarot-artwork--back"
                              role={deck.cardBackImageUrl ? "img" : undefined}
                              aria-label={
                                deck.cardBackImageUrl
                                  ? formatTarotMessage(
                                      tarotCopy.cardBackLabel,
                                      {
                                        name: deck.name,
                                      },
                                    )
                                  : undefined
                              }
                              style={
                                deck.cardBackImageUrl
                                  ? {
                                      backgroundImage: `url("${deck.cardBackImageUrl}")`,
                                    }
                                  : undefined
                              }
                            >
                              {!deck.cardBackImageUrl && (
                                <span>{tarotCopy.adminBackNeeded}</span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`admin-tarot-state ${
                              deck.active ? "is-active" : ""
                            }`}
                          >
                            {deck.active
                              ? tarotCopy.adminActive
                              : tarotCopy.adminInactive}
                          </span>
                        </header>

                        <form className="admin-form" action={saveTarotDeck}>
                          <input type="hidden" name="id" value={deck.id} />
                          <code>{deck.id}</code>
                          <label>
                            {tarotCopy.adminName}
                            <input
                              name="name"
                              defaultValue={deck.name}
                              required
                              minLength={2}
                              maxLength={80}
                            />
                          </label>
                          <label>
                            {tarotCopy.adminTagline}
                            <textarea
                              name="tagline"
                              defaultValue={deck.tagline}
                              required
                              minLength={10}
                              maxLength={240}
                            />
                          </label>
                          <fieldset className="admin-localization-fields">
                            <legend>{tarotCopy.adminLocalizedMetadata}</legend>
                            <label>
                              {tarotCopy.adminSpanishName}
                              <input
                                name="name_es"
                                defaultValue={translatedDeckField(
                                  deck.translations,
                                  "es-ES",
                                  "name",
                                )}
                                required
                                minLength={2}
                                maxLength={80}
                              />
                            </label>
                            <label>
                              {tarotCopy.adminSpanishTagline}
                              <textarea
                                name="tagline_es"
                                defaultValue={translatedDeckField(
                                  deck.translations,
                                  "es-ES",
                                  "tagline",
                                )}
                                required
                                minLength={10}
                                maxLength={240}
                              />
                            </label>
                            <label>
                              {tarotCopy.adminFrenchName}
                              <input
                                name="name_fr"
                                defaultValue={translatedDeckField(
                                  deck.translations,
                                  "fr-FR",
                                  "name",
                                )}
                                required
                                minLength={2}
                                maxLength={80}
                              />
                            </label>
                            <label>
                              {tarotCopy.adminFrenchTagline}
                              <textarea
                                name="tagline_fr"
                                defaultValue={translatedDeckField(
                                  deck.translations,
                                  "fr-FR",
                                  "tagline",
                                )}
                                required
                                minLength={10}
                                maxLength={240}
                              />
                            </label>
                            <label>
                              {tarotCopy.adminGermanName}
                              <input
                                name="name_de"
                                defaultValue={translatedDeckField(
                                  deck.translations,
                                  "de-DE",
                                  "name",
                                )}
                                required
                                minLength={2}
                                maxLength={80}
                              />
                            </label>
                            <label>
                              {tarotCopy.adminGermanTagline}
                              <textarea
                                name="tagline_de"
                                defaultValue={translatedDeckField(
                                  deck.translations,
                                  "de-DE",
                                  "tagline",
                                )}
                                required
                                minLength={10}
                                maxLength={240}
                              />
                            </label>
                          </fieldset>
                          <div className="admin-form__split">
                            <label>
                              {tarotCopy.adminAccent}
                              <select
                                name="accent_token"
                                defaultValue={deck.accent_token}
                              >
                                <option value="gold">
                                  {tarotCopy.adminAccentGold}
                                </option>
                                <option value="copper">
                                  {tarotCopy.adminAccentCopper}
                                </option>
                                <option value="map-cyan">
                                  {tarotCopy.adminAccentMapCyan}
                                </option>
                                <option value="map-red">
                                  {tarotCopy.adminAccentMapRed}
                                </option>
                                <option value="map-chalk">
                                  {tarotCopy.adminAccentMapChalk}
                                </option>
                              </select>
                            </label>
                            <label>
                              {tarotCopy.adminMinimumPlan}
                              <select
                                name="minimum_plan"
                                defaultValue={deck.minimum_plan}
                              >
                                <option value="free">
                                  {tarotCopy.adminPlanFree}
                                </option>
                                <option value="personal">
                                  {tarotCopy.adminPlanPersonal}
                                </option>
                                <option value="premium">
                                  {tarotCopy.adminPlanPremium}
                                </option>
                              </select>
                            </label>
                          </div>
                          <label>
                            {tarotCopy.adminSortOrder}
                            <input
                              name="sort_order"
                              type="number"
                              min={0}
                              max={1000}
                              defaultValue={deck.sort_order}
                            />
                          </label>
                          <label className="admin-check-row">
                            <input
                              name="active"
                              type="checkbox"
                              defaultChecked={deck.active}
                            />
                            {tarotCopy.adminActive}
                          </label>
                          <button
                            className="button-primary"
                            disabled={!canManageContent}
                          >
                            {tarotCopy.adminSaveAction}
                          </button>
                        </form>

                        <div className="admin-tarot-uploads">
                          <TarotDeckArtworkForm
                            deckId={deck.id}
                            kind="cover"
                            hasArtwork={Boolean(deck.cover_image_path)}
                            disabled={!canManageContent}
                            copy={tarotCopy}
                          />
                          <TarotDeckArtworkForm
                            deckId={deck.id}
                            kind="card-back"
                            hasArtwork={Boolean(deck.card_back_image_path)}
                            disabled={!canManageContent}
                            copy={tarotCopy}
                          />
                          <TarotDeckArtworkForm
                            deckId={deck.id}
                            kind="card-face"
                            hasArtwork={cardFaceCount > 0}
                            disabled={!canManageContent}
                            copy={tarotCopy}
                            cards={tarotCardOptions}
                            faceCount={cardFaceCount}
                            totalFaces={tarotCardOptions.length}
                          />
                        </div>
                      </article>
                    );
                  })}
                  {!tarotDecks.length && (
                    <p className="admin-empty-state">
                      {tarotCopy.adminNoDecks}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="admin-section" id="journal">
            <div className="admin-section__heading">
              <p className="eyebrow">Editorial ephemeris</p>
              <h2>Journal authoring</h2>
              <p>Draft, optimize, and publish first-party articles.</p>
            </div>
            <div className="admin-card-grid admin-card-grid--two">
              <form
                className="admin-form admin-blog-form"
                action={saveBlogPost}
              >
                <h3>New journal entry</h3>
                <label>
                  Title
                  <input name="title" required minLength={3} maxLength={140} />
                </label>
                <label>
                  Slug
                  <input
                    name="slug"
                    required
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  />
                </label>
                <label>
                  Excerpt
                  <textarea
                    name="excerpt"
                    required
                    minLength={20}
                    maxLength={360}
                  />
                </label>
                <label>
                  Article body{" "}
                  <small>Separate paragraphs with a blank line</small>
                  <textarea name="body" required minLength={50} rows={12} />
                </label>
                <label>
                  SEO title
                  <input name="seo_title" maxLength={80} />
                </label>
                <label>
                  SEO description
                  <textarea name="seo_description" maxLength={220} />
                </label>
                <label>
                  Status
                  <select name="status" defaultValue="draft">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>
                <button className="button-primary" disabled={!canManageContent}>
                  Save entry
                </button>
              </form>
              <div className="admin-post-list">
                <h3>Journal library</h3>
                {(postsResult.data ?? []).map((post) => (
                  <article key={post.id}>
                    <div>
                      <strong>{post.title}</strong>
                      <small>
                        {post.status} · updated{" "}
                        {new Date(post.updated_at).toLocaleDateString("en-GB")}
                      </small>
                    </div>
                    <div>
                      <Link
                        className="button-quiet"
                        href={`/admin/blog/${post.id}`}
                      >
                        Edit
                      </Link>
                      {post.status === "published" && (
                        <Link
                          className="button-quiet"
                          href={`/journal/${post.slug}`}
                        >
                          View
                        </Link>
                      )}
                      <form action={deleteBlogPost}>
                        <input type="hidden" name="id" value={post.id} />
                        <button
                          className="button-danger"
                          disabled={!canManageContent}
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="admin-section" id="contact-messages">
            <div className="admin-section__heading">
              <p className="eyebrow">Private correspondence</p>
              <h2>Contact messages</h2>
              <p>Recent messages submitted through the public contact form.</p>
            </div>
            <div className="admin-contact-list">
              {(contactResult.data ?? []).map((item) => (
                <article key={item.id}>
                  <header>
                    <div>
                      <strong>{item.name}</strong>
                      <a href={`mailto:${item.email}`}>{item.email}</a>
                    </div>
                    <div>
                      <span>{item.reason.replaceAll("_", " ")}</span>
                      <time>
                        {new Date(item.created_at).toLocaleString("en-GB")}
                      </time>
                    </div>
                  </header>
                  <p>{item.message}</p>
                  <small>
                    Notification:{" "}
                    {item.notification_status.replaceAll("_", " ")}
                  </small>
                </article>
              ))}
              {!contactResult.data?.length && <p>No contact messages yet.</p>}
            </div>
          </section>

          <section className="admin-section" id="audit">
            <div className="admin-section__heading">
              <p className="eyebrow">Audit trail</p>
              <h2>Recent privileged changes</h2>
            </div>
            <ol className="admin-audit-list">
              {(auditResult.data ?? []).map((item) => (
                <li key={item.id}>
                  <code>{item.action}</code>
                  <span>{item.setting_key ?? "—"}</span>
                  <time>
                    {new Date(item.created_at).toLocaleString("en-GB")}
                  </time>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </main>
  );
}
