export const PRIVATE_RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
} as const;

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;
  const protocol = request.headers.get("x-forwarded-proto") ?? "https";
  try {
    return new URL(origin).origin === `${protocol}://${host}`;
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
