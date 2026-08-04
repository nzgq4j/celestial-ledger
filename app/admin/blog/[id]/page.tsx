import Link from "next/link";
import { notFound } from "next/navigation";
import { saveBlogPost } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Edit journal entry",
  robots: { index: false, follow: false },
};

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin(["site_admin", "content_admin"]);
  const { id } = await params;
  const { data: post } = await createAdminClient()
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!post) notFound();
  return (
    <main className="admin-shell admin-editor-page">
      <Link className="horoscope-back" href="/admin#journal">
        ← Administration
      </Link>
      <header className="admin-section__heading">
        <p className="eyebrow">Editorial ephemeris</p>
        <h1>Edit journal entry</h1>
      </header>
      <form className="admin-form admin-blog-form" action={saveBlogPost}>
        <input type="hidden" name="id" value={post.id} />
        <label>
          Title
          <input name="title" defaultValue={post.title} required />
        </label>
        <label>
          Slug
          <input name="slug" defaultValue={post.slug} required />
        </label>
        <label>
          Excerpt
          <textarea name="excerpt" defaultValue={post.excerpt} required />
        </label>
        <label>
          Article body
          <textarea name="body" defaultValue={post.body} rows={20} required />
        </label>
        <label>
          SEO title
          <input name="seo_title" defaultValue={post.seo_title ?? ""} />
        </label>
        <label>
          SEO description
          <textarea
            name="seo_description"
            defaultValue={post.seo_description ?? ""}
          />
        </label>
        <label>
          Status
          <select name="status" defaultValue={post.status}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <button className="button-primary">Save changes</button>
      </form>
    </main>
  );
}
