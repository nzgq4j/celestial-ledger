import { NextRequest } from "next/server";
import tzlookup from "tz-lookup";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length < 2) return Response.json({ error: "Enter at least two characters." }, { status: 400 });
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "6");
    url.searchParams.set("featuretype", "settlement");
    const response = await fetch(url, {
      headers: {
        "User-Agent": process.env.NOMINATIM_USER_AGENT || "PersonalHoroscopeApp/1.0",
        "Accept-Language": "en"
      },
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);
    const rows = await response.json() as any[];
    const places = rows.map((row) => {
      const latitude = Number(row.lat);
      const longitude = Number(row.lon);
      const a = row.address || {};
      return {
        id: String(row.place_id),
        city: a.city || a.town || a.village || a.municipality || row.name || "Unknown place",
        region: a.state || a.county || a.region,
        country: a.country || "Unknown country",
        displayName: row.display_name,
        latitude,
        longitude,
        timeZone: tzlookup(latitude, longitude)
      };
    });
    return Response.json({ places }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "The birthplace search service is unavailable. Try again." }, { status: 502 });
  }
}
