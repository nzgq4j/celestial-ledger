import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StructuredData } from "@/components/StructuredData";
import { createPageMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";

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
  return createPageMetadata({
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    path: `/journal/${post.slug}`,
    type: "article",
    image: `/journal/${post.slug}/opengraph-image`,
    publishedTime: post.published_at ?? undefined,
    modifiedTime: post.updated_at ?? undefined,
    authors: [post.author_name],
    keywords: ["astrology journal", "planetary cycles", "natal astrology"],
  });
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
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.seo_description || post.excerpt,
          image: [`${SITE_URL}/journal/${post.slug}/opengraph-image`],
          datePublished: post.published_at,
          dateModified: post.updated_at,
          mainEntityOfPage: `${SITE_URL}/journal/${post.slug}`,
          author: { "@type": "Person", name: post.author_name },
          publisher: { "@type": "Organization", name: SITE_NAME },
        }}
      />
      <Link className="horoscope-back" href="/journal">
        ← Celestial Journal
      </Link>
      <article>
        <header>
          <Image
            className="journal-entry__featured-image"
            src={`/journal/${post.slug}/opengraph-image`}
            alt={`${post.title} featured celestial illustration`}
            width={1200}
            height={630}
            priority
          />
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
