export const PRIVATE_RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
} as const;

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!origin) return fetchSite !== "cross-site";
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function readLimitedJson(
  request: Request,
  maximumBytes: number,
): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes)
    throw new RequestPayloadError("REQUEST_TOO_LARGE");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maximumBytes)
    throw new RequestPayloadError("REQUEST_TOO_LARGE");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new RequestPayloadError("INVALID_JSON");
  }
}

export class RequestPayloadError extends Error {
  constructor(public readonly code: "REQUEST_TOO_LARGE" | "INVALID_JSON") {
    super(code);
  }
}
