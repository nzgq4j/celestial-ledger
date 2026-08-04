import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

async function postFor(slug: string) {
  const { data } = await (
    await createClient()
  )
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const post = await postFor((await params).slug);
  if (!post) return {};
  return {
    title: post.seo_title || `${post.title} — Celestial Atlas`,
    description: post.seo_description || post.excerpt,
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      authors: [post.author_name],
    },
  };
}

export default async function JournalPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = await postFor((await params).slug);
  if (!post) notFound();
  const paragraphs = post.body
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  return (
    <main className="page-shell journal-entry">
      <Link className="horoscope-back" href="/journal">
        ← Celestial Journal
      </Link>
      <article>
        <header>
          <p className="eyebrow">
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : ""}
          </p>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
          <small>By {post.author_name}</small>
        </header>
        <div className="journal-entry__body">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>
    </main>
  );
}
