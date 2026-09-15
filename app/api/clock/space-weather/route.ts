import { getSpaceWeather } from "@/lib/clock/space-weather";

export const runtime = "nodejs";
export async function GET(request: Request) {
  if (new URL(request.url).search)
    return Response.json(
      { error: "This feed takes no parameters." },
      { status: 400 },
    );
  return Response.json(await getSpaceWeather(), {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=300",
      "X-Robots-Tag": "noindex",
    },
  });
}
