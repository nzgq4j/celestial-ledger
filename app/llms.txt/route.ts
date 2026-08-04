import { getAdminSettings } from "@/lib/admin/settings";

export async function GET() {
  const settings = await getAdminSettings();
  if (!settings.geo.enabled)
    return new Response("Not enabled.\n", { status: 404 });
  return new Response(
    `# Celestial Atlas\n\n${settings.geo.organizationDescription}\n\n## Primary resources\n- ${settings.seo.canonicalBase}/horoscopes\n- ${settings.seo.canonicalBase}/journal\n- ${settings.seo.canonicalBase}/method\n- ${settings.seo.canonicalBase}/samples\n`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}
