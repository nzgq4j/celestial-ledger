import "server-only";

import nodemailer from "nodemailer";

const notificationTo = "admin@celestialatlas.app";

export async function sendContactNotification(input: {
  id: string;
  name: string;
  email: string;
  reason: string;
  message: string;
}) {
  const password = process.env.MAIL_PWD;
  if (!password) return { status: "not_configured" as const };
  const host = process.env.MAIL_HOST ?? "mail.celestialatlas.app";
  const port = Number(process.env.MAIL_PORT ?? "465");
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    return { status: "not_configured" as const };

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: {
      user: process.env.MAIL_USER ?? "support",
      pass: password,
    },
    tls: { servername: host },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  const result = await transporter.sendMail({
    from:
      process.env.MAIL_FROM ??
      "Celestial Atlas Support <support@celestialatlas.app>",
    to: notificationTo,
    replyTo: input.email,
    subject: `Celestial Atlas contact: ${input.reason}`,
    text: [
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      `Reason: ${input.reason}`,
      `Message ID: ${input.id}`,
      "",
      input.message,
    ].join("\n"),
    headers: { "X-Contact-Message-ID": input.id },
  });
  return { status: "sent" as const, id: result.messageId };
}
