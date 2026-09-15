import { calculateClock } from "@/lib/clock/calculation";
import { clockQuerySchema, utcMinute } from "@/lib/clock/domain";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsed = clockQuerySchema.safeParse(Object.fromEntries(params));
  if (
    !parsed.success ||
    [...params.keys()].length !== new Set(params.keys()).size
  ) {
    return Response.json(
      { error: "Choose a UTC date between 2000 and 2050." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    const utc = utcMinute(new Date(parsed.data.at ?? Date.now()));
    return Response.json(calculateClock(utc), {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=60",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch {
    return Response.json(
      { error: "The sky calculation is unavailable. Try again." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
