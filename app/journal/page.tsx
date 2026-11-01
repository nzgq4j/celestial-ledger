import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createPageMetadata } from "@/lib/seo";
import { journalFeaturedImage } from "@/lib/journal/featured-images";
import "@/app/styles/atlas-public.css";

export const dynamic = "force-dynamic";
export const metadata = createPageMetadata({
  title: "Celestial Journal",
  description:
    "Astrological essays on natal symbolism, planetary transits, houses, aspects, numerology, and practical guidance from Celestial Atlas.",
  path: "/journal",
  keywords: ["astrology journal", "astrology essays", "planetary cycles"],
});

export default async function JournalPage() {
  const { data: posts } = await (
    await createClient()
  )
    .from("blog_posts")
    .select("id,slug,title,excerpt,author_name,published_at")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });
  return (
    <main className="atlas-shell public-page">
      <header className="public-page__hero">
        <p className="atlas-kicker">Celestial Journal</p>
        <h1 className="atlas-page-title">Dispatches from the living sky</h1>
        <p>
          Essays on planetary movements, natal patterns, numerology, ritual, and
          the ancient correspondences that shape a personal atlas.
        </p>
      </header>
      <section className="public-journal">
        {(posts ?? []).map((post) => (
          <article key={post.id} className="public-journal__card">
            <Link
              className="public-journal__image"
              href={`/journal/${post.slug}`}
              aria-label={`Read ${post.title}`}
            >
              <Image
                src={journalFeaturedImage(post.slug)}
                alt={`${post.title} featured celestial illustration`}
                width={1200}
                height={630}
                sizes="(max-width: 760px) 100vw, 50vw"
              />
            </Link>
            <p className="atlas-meta">
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : ""}
            </p>
            <h2>
              <Link href={`/journal/${post.slug}`}>{post.title}</Link>
            </h2>
            <p>{post.excerpt}</p>
            <small>By {post.author_name}</small>
            <Link className="atlas-link" href={`/journal/${post.slug}`}>
              Read the entry <span aria-hidden="true">→</span>
            </Link>
          </article>
        ))}
        {!posts?.length && (
          <p className="public-note">
            The first journal entry is being prepared.
          </p>
        )}
      </section>
    </main>
  );
}
