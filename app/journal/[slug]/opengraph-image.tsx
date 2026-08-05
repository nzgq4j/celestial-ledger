import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const alt = "Featured image for a Celestial Journal article";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function JournalOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: post } = await (
    await createClient()
  )
    .from("blog_posts")
    .select("title,excerpt,author_name")
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  const title = post?.title ?? "Celestial Journal";
  const excerpt = post?.excerpt ?? "Dispatches from the living sky";
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "70px 82px",
        color: "#f5eddb",
        background:
          "radial-gradient(circle at 84% 18%, rgba(209,173,91,.2), transparent 22%), linear-gradient(135deg, #030811, #09172a 60%, #111a2b)",
      }}
    >
      <div
        style={{
          display: "flex",
          color: "#d3b46f",
          fontSize: 23,
          letterSpacing: ".16em",
          textTransform: "uppercase",
        }}
      >
        Celestial Journal · Celestial Atlas
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            maxWidth: 1000,
            fontFamily: "Georgia",
            fontSize: title.length > 58 ? 58 : 72,
            lineHeight: 1.05,
          }}
        >
          {title}
        </div>
        <div
          style={{
            maxWidth: 930,
            marginTop: 24,
            color: "#c9c0b0",
            fontSize: 27,
            lineHeight: 1.35,
          }}
        >
          {excerpt.slice(0, 180)}
        </div>
      </div>
      <div style={{ display: "flex", color: "#a8a092", fontSize: 21 }}>
        {post?.author_name ? `By ${post.author_name}` : "celestialatlas.app"}
      </div>
    </div>,
    size,
  );
}
