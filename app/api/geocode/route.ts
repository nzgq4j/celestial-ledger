import { NextRequest } from "next/server";
import tzlookup from "tz-lookup";
import { z } from "zod";

export const runtime = "nodejs";

const hits = new Map<string, number[]>();
const geocodeRowSchema = z.object({
  place_id: z.union([z.string(), z.number()]),
  lat: z.string(),
  lon: z.string(),
  name: z.string().optional(),
  display_name: z.string().min(1).max(500),
  address: z
    .object({
      city: z.string().optional(),
      town: z.string().optional(),
      village: z.string().optional(),
      municipality: z.string().optional(),
      state: z.string().optional(),
      county: z.string().optional(),
      region: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < 60_000);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > 30;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length < 2 || query.length > 120)
    return Response.json(
      { error: "Enter between 2 and 120 characters." },
      { status: 400 },
    );
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous";
  if (rateLimited(ip))
    return Response.json(
      { error: "Too many birthplace searches. Try again shortly." },
      { status: 429 },
    );
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "6");
    url.searchParams.set("featuretype", "settlement");
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          process.env.NOMINATIM_USER_AGENT || "PersonalHoroscopeApp/1.0",
        "Accept-Language": "en",
      },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);
    const rows = z
      .array(geocodeRowSchema)
      .max(6)
      .parse(await response.json());
    const places = rows.flatMap((row) => {
      const latitude = Number(row.lat);
      const longitude = Number(row.lon);
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      )
        return [];
      const a = row.address || {};
      return [
        {
          id: String(row.place_id),
          city:
            a.city ||
            a.town ||
            a.village ||
            a.municipality ||
            row.name ||
            "Unknown place",
          region: a.state || a.county || a.region,
          country: a.country || "Unknown country",
          displayName: row.display_name,
          latitude,
          longitude,
          timeZone: tzlookup(latitude, longitude),
        },
      ];
    });
    return Response.json(
      { places },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      { error: "The birthplace search service is unavailable. Try again." },
      { status: 502 },
    );
  }
}
