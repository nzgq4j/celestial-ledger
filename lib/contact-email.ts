import "server-only";

const notificationTo = "admin@celestialatlas.app";

export async function sendContactNotification(input: {
  id: string;
  name: string;
  email: string;
  reason: string;
  message: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_NOTIFICATION_FROM;
  if (!apiKey || !from) return { status: "not_configured" as const };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `contact-${input.id}`,
    },
    body: JSON.stringify({
      from,
      to: [notificationTo],
      reply_to: input.email,
      subject: `Celestial Atlas contact: ${input.reason}`,
      text: [
        `Name: ${input.name}`,
        `Email: ${input.email}`,
        `Reason: ${input.reason}`,
        `Message ID: ${input.id}`,
        "",
        input.message,
      ].join("\n"),
      tags: [{ name: "category", value: "contact_notification" }],
    }),
    cache: "no-store",
  });
  if (!response.ok) return { status: "failed" as const };
  const result = (await response.json()) as { id?: string };
  return { status: "sent" as const, id: result.id };
}
