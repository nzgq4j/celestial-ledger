"use client";

import { useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready(callback: () => void): void;
      execute(siteKey: string, options: { action: string }): Promise<string>;
    };
  }
}

async function recaptchaToken() {
  const deadline = Date.now() + 5000;
  let siteKey: string | null = null;
  while (Date.now() < deadline) {
    const script = document.querySelector<HTMLScriptElement>(
      'script[src*="recaptcha/api.js"]',
    );
    siteKey = script ? new URL(script.src).searchParams.get("render") : null;
    if (siteKey && window.grecaptcha) break;
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
  if (!siteKey || !window.grecaptcha) return undefined;
  await new Promise<void>((resolve) => window.grecaptcha!.ready(resolve));
  return window.grecaptcha.execute(siteKey, { action: "contact_submit" });
}

export function ContactForm() {
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "captcha" | "invalid" | "error"
  >("idle");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        recaptchaToken: await recaptchaToken(),
      }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    if (response.ok) {
      form.reset();
      setStatus("sent");
    } else if (result.error === "CAPTCHA_REJECTED") setStatus("captcha");
    else if (result.error === "INVALID_MESSAGE") setStatus("invalid");
    else setStatus("error");
  }
  return (
    <form className="contact-form" onSubmit={submit}>
      <label>
        Name
        <input name="name" required maxLength={100} autoComplete="name" />
      </label>
      <label>
        Email
        <input
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
        />
      </label>
      <label>
        Contact reason
        <select name="reason" required defaultValue="general">
          <option value="general">General question</option>
          <option value="account">Account support</option>
          <option value="billing">Billing</option>
          <option value="privacy">Privacy or data request</option>
          <option value="technical">Technical issue</option>
          <option value="partnership">Partnership</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="contact-form__message">
        Message
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={9}
        />
      </label>
      <label className="contact-form__honeypot" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <button className="button-primary" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
      <p
        className="contact-form__status"
        role="status"
        data-success={status === "sent"}
      >
        {status === "sent" && "Thank you. Your message has been received."}
        {status === "captcha" &&
          "Verification could not be completed. Refresh the page and try again."}
        {status === "invalid" &&
          "Check each field and make sure your message is at least 10 characters."}
        {status === "error" &&
          "Your message could not be sent. Please try again."}
      </p>
    </form>
  );
}
