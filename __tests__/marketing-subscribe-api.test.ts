import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/marketing/subscribe/route";

function request(body: unknown, headers: HeadersInit = {}) {
  return new Request("https://celestial.example/api/marketing/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /api/marketing/subscribe", () => {
  it("rejects cross-origin requests", async () => {
    const response = await POST(
      request(
        {
          firstName: "Ada",
          email: "ada@example.com",
          consent: true,
          consentVersion: "marketing-v1-2026-08-03",
          website: "",
        },
        { origin: "https://attacker.example", host: "celestial.example" },
      ),
    );
    expect(response.status).toBe(403);
  });

  it("requires affirmative, versioned consent", async () => {
    const response = await POST(
      request({
        firstName: "Ada",
        email: "ada@example.com",
        consent: false,
        consentVersion: "marketing-v1-2026-08-03",
        website: "",
      }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects unknown fields", async () => {
    const response = await POST(
      request({
        firstName: "Ada",
        email: "ada@example.com",
        consent: true,
        consentVersion: "marketing-v1-2026-08-03",
        website: "",
        birthDate: "1815-12-10",
      }),
    );
    expect(response.status).toBe(400);
  });
});
