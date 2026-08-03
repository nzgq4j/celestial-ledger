#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRef = process.env.SUPABASE_PROJECT_REF ?? "jyguyvpbstskpuwqwrok";
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const shouldApply = process.argv.includes("--apply");
const shouldExport = process.argv.includes("--export");
const appUrl = "https://www.celestialatlas.app";
const logoUrl = `${appUrl}/celestialatlas-logo.png`;

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function brandedEmail({ eyebrow, heading, paragraphs, action, code, detail }) {
  const body = paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;color:#c8c0ae;font:16px/1.6 Arial,sans-serif;">${paragraph}</p>`,
    )
    .join("");
  const actionHtml = action
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0;"><tr><td style="border-radius:4px;background:#d4b15f;"><a href="${action.href}" style="display:inline-block;padding:14px 22px;color:#07111f;font:bold 15px Arial,sans-serif;text-decoration:none;">${action.label}</a></td></tr></table><p style="margin:0 0 16px;color:#8f98a6;font:13px/1.6 Arial,sans-serif;">If the button does not work, copy this address into your browser:<br><a href="${action.href}" style="color:#d4b15f;word-break:break-all;">${action.href}</a></p>`
    : "";
  const codeHtml = code
    ? `<div style="margin:24px 0;padding:18px;border:1px solid #806d3d;background:#081422;color:#f4e5b7;font:bold 30px/1.2 'Courier New',monospace;letter-spacing:8px;text-align:center;">${code}</div>`
    : "";
  const detailHtml = detail
    ? `<div style="margin:22px 0;padding:14px 16px;border-left:3px solid #d4b15f;background:#0b1827;color:#d8d0bd;font:14px/1.6 Arial,sans-serif;">${detail}</div>`
    : "";

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#050b13;">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;">${escapeHtml(heading)} — Celestial Atlas</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050b13;">
      <tr><td align="center" style="padding:30px 14px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;border:1px solid #27374b;background:#07111f;">
          <tr><td style="padding:24px 28px;border-bottom:1px solid #27374b;">
            <table role="presentation" cellspacing="0" cellpadding="0"><tr>
              <td style="padding-right:14px;"><img src="${logoUrl}" width="52" height="52" alt="Celestial Atlas" style="display:block;border:0;border-radius:50%;"></td>
              <td><div style="color:#f1e8d5;font:24px/1.15 Georgia,serif;">Celestial Atlas</div><div style="margin-top:5px;color:#b99a52;font:11px/1.2 Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;">Ancient sky · personal atlas</div></td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:34px 28px 30px;">
            <div style="margin-bottom:11px;color:#c9a75d;font:bold 11px/1.2 Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;">${eyebrow}</div>
            <h1 style="margin:0 0 20px;color:#f1e8d5;font:normal 32px/1.2 Georgia,serif;">${heading}</h1>
            ${body}${detailHtml}${codeHtml}${actionHtml}
          </td></tr>
          <tr><td style="padding:20px 28px;border-top:1px solid #27374b;color:#7f8998;font:12px/1.6 Arial,sans-serif;">
            This message concerns your private Celestial Atlas account. May your atlas illuminate the patterns written across your sky.<br>
            <a href="${appUrl}" style="color:#bca15f;text-decoration:none;">celestialatlas.app</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

const confirmUrl = (type, next = "") =>
  `${appUrl}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=${type}${next}`;

const config = {
  mailer_subjects_confirmation: "Confirm your Celestial Atlas account",
  mailer_templates_confirmation_content: brandedEmail({
    eyebrow: "Account confirmation",
    heading: "Confirm your email address",
    paragraphs: [
      "Welcome to Celestial Atlas. Confirm your email address to finish creating your private account.",
    ],
    action: { label: "Confirm email address", href: confirmUrl("email") },
  }),
  mailer_subjects_invite: "You’re invited to Celestial Atlas",
  mailer_templates_invite_content: brandedEmail({
    eyebrow: "Private invitation",
    heading: "Your invitation is ready",
    paragraphs: [
      "You have been invited to create a private Celestial Atlas account.",
    ],
    action: { label: "Accept invitation", href: confirmUrl("invite") },
  }),
  mailer_subjects_magic_link: "Your Celestial Atlas sign-in link",
  mailer_templates_magic_link_content: brandedEmail({
    eyebrow: "Secure sign in",
    heading: "Continue to Celestial Atlas",
    paragraphs: [
      "Use this single-use link to sign in. If you did not request it, you can ignore this email.",
    ],
    action: { label: "Sign in securely", href: confirmUrl("magiclink") },
  }),
  mailer_subjects_email_change:
    "Confirm your new Celestial Atlas email address",
  mailer_templates_email_change_content: brandedEmail({
    eyebrow: "Account change",
    heading: "Confirm your new email address",
    paragraphs: [
      "Confirm the new email address for your Celestial Atlas account.",
    ],
    detail:
      'New email address: <strong style="color:#f1e8d5;">{{ .NewEmail }}</strong>',
    action: { label: "Confirm new email", href: confirmUrl("email_change") },
  }),
  mailer_subjects_recovery: "Reset your Celestial Atlas password",
  mailer_templates_recovery_content: brandedEmail({
    eyebrow: "Password recovery",
    heading: "Choose a new password",
    paragraphs: [
      "We received a request to reset your Celestial Atlas password. If you did not request this, you can ignore this email.",
    ],
    action: {
      label: "Reset password",
      href: confirmUrl("recovery", "&amp;next=/auth/update-password"),
    },
  }),
  mailer_subjects_reauthentication:
    "{{ .Token }} is your Celestial Atlas verification code",
  mailer_templates_reauthentication_content: brandedEmail({
    eyebrow: "Identity check",
    heading: "Your verification code",
    paragraphs: [
      "Enter this single-use code in Celestial Atlas to confirm a sensitive account action.",
    ],
    code: "{{ .Token }}",
  }),
  mailer_subjects_password_changed_notification:
    "Your Celestial Atlas password was changed",
  mailer_templates_password_changed_notification_content: brandedEmail({
    eyebrow: "Security notice",
    heading: "Your password was changed",
    paragraphs: [
      "The password for your Celestial Atlas account was recently changed.",
      `If this was not you, use <a href="${appUrl}/auth/forgot-password" style="color:#d4b15f;">password recovery</a> immediately.`,
    ],
  }),
  mailer_subjects_email_changed_notification:
    "Your Celestial Atlas email address was changed",
  mailer_templates_email_changed_notification_content: brandedEmail({
    eyebrow: "Security notice",
    heading: "Your email address was changed",
    paragraphs: [
      "The email address for your Celestial Atlas account was changed.",
    ],
    detail:
      'Previous: <strong style="color:#f1e8d5;">{{ .OldEmail }}</strong><br>Current: <strong style="color:#f1e8d5;">{{ .Email }}</strong>',
  }),
  mailer_subjects_phone_changed_notification:
    "Your Celestial Atlas phone number was changed",
  mailer_templates_phone_changed_notification_content: brandedEmail({
    eyebrow: "Security notice",
    heading: "Your phone number was changed",
    paragraphs: [
      "The phone number associated with your Celestial Atlas account was changed.",
    ],
    detail:
      'Previous: <strong style="color:#f1e8d5;">{{ .OldPhone }}</strong><br>Current: <strong style="color:#f1e8d5;">{{ .Phone }}</strong>',
  }),
  mailer_subjects_identity_linked_notification:
    "A sign-in method was linked to Celestial Atlas",
  mailer_templates_identity_linked_notification_content: brandedEmail({
    eyebrow: "Security notice",
    heading: "A sign-in method was linked",
    paragraphs: [
      "A new sign-in method was linked to your Celestial Atlas account.",
    ],
    detail:
      'Provider: <strong style="color:#f1e8d5;">{{ .Provider }}</strong><br>Account: <strong style="color:#f1e8d5;">{{ .Email }}</strong>',
  }),
  mailer_subjects_identity_unlinked_notification:
    "A sign-in method was removed from Celestial Atlas",
  mailer_templates_identity_unlinked_notification_content: brandedEmail({
    eyebrow: "Security notice",
    heading: "A sign-in method was removed",
    paragraphs: [
      "A sign-in method was removed from your Celestial Atlas account.",
    ],
    detail:
      'Provider: <strong style="color:#f1e8d5;">{{ .Provider }}</strong><br>Account: <strong style="color:#f1e8d5;">{{ .Email }}</strong>',
  }),
  mailer_subjects_mfa_factor_enrolled_notification:
    "A verification method was added to Celestial Atlas",
  mailer_templates_mfa_factor_enrolled_notification_content: brandedEmail({
    eyebrow: "Security notice",
    heading: "A verification method was added",
    paragraphs: [
      "A new verification method was added to your Celestial Atlas account.",
    ],
    detail: 'Method: <strong style="color:#f1e8d5;">{{ .FactorType }}</strong>',
  }),
  mailer_subjects_mfa_factor_unenrolled_notification:
    "A verification method was removed from Celestial Atlas",
  mailer_templates_mfa_factor_unenrolled_notification_content: brandedEmail({
    eyebrow: "Security notice",
    heading: "A verification method was removed",
    paragraphs: [
      "A verification method was removed from your Celestial Atlas account.",
    ],
    detail: 'Method: <strong style="color:#f1e8d5;">{{ .FactorType }}</strong>',
  }),
};

const artifacts = [
  ["confirm-sign-up", "Confirm sign up", "confirmation"],
  ["invite-user", "Invite user", "invite"],
  ["magic-link-or-otp", "Magic link or OTP", "magic_link"],
  ["change-email-address", "Change email address", "email_change"],
  ["reset-password", "Reset password", "recovery"],
  ["reauthentication", "Reauthentication", "reauthentication"],
  ["password-changed", "Password changed", "password_changed_notification"],
  [
    "email-address-changed",
    "Email address changed",
    "email_changed_notification",
  ],
  [
    "phone-number-changed",
    "Phone number changed",
    "phone_changed_notification",
  ],
  [
    "sign-in-method-linked",
    "Sign-in method linked",
    "identity_linked_notification",
  ],
  [
    "sign-in-method-removed",
    "Sign-in method removed",
    "identity_unlinked_notification",
  ],
  [
    "verification-method-added",
    "Verification method added",
    "mfa_factor_enrolled_notification",
  ],
  [
    "verification-method-removed",
    "Verification method removed",
    "mfa_factor_unenrolled_notification",
  ],
];

if (shouldExport) {
  const scriptDirectory = dirname(fileURLToPath(import.meta.url));
  const artifactDirectory = join(
    scriptDirectory,
    "..",
    "docs",
    "operations",
    "supabase-email-templates",
  );
  await mkdir(artifactDirectory, { recursive: true });

  const subjectRows = [];
  for (const [fileName, dashboardLabel, configName] of artifacts) {
    const subject = config[`mailer_subjects_${configName}`];
    const content = config[`mailer_templates_${configName}_content`];
    await writeFile(
      join(artifactDirectory, `${fileName}.html`),
      `${content}\n`,
      "utf8",
    );
    subjectRows.push(
      `| ${dashboardLabel} | \`${subject}\` | [HTML](./${fileName}.html) |`,
    );
  }

  await writeFile(
    join(artifactDirectory, "SUBJECTS.md"),
    `# Celestial Atlas Supabase email artifacts\n\nCopy each subject and the complete contents of its HTML file into the matching Supabase **Authentication > Emails** template.\n\n| Supabase dashboard template | Subject | Body |\n| --- | --- | --- |\n${subjectRows.join("\n")}\n`,
    "utf8",
  );
  console.log(
    `Exported ${artifacts.length} manual-paste templates to ${artifactDirectory}.`,
  );
}

if (!shouldApply && !shouldExport) {
  console.log(
    `Dry run: ${Object.keys(config).length / 2} Celestial Atlas email templates are ready for project ${projectRef}.`,
  );
  console.log(
    "Run with --apply and SUPABASE_ACCESS_TOKEN set to publish them. Security notification enable/disable settings are not changed.",
  );
  process.exit(0);
}

if (!shouldApply) {
  process.exit(0);
}

if (!accessToken) {
  console.error(
    "SUPABASE_ACCESS_TOKEN is required with --apply. Create a personal access token in Supabase Account > Access Tokens; do not commit it.",
  );
  process.exit(1);
}

const response = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  },
);

if (!response.ok) {
  const message = await response.text();
  console.error(
    `Supabase rejected the template update (${response.status}): ${message}`,
  );
  process.exit(1);
}

console.log(
  `Published ${Object.keys(config).length / 2} Celestial Atlas email templates to project ${projectRef}.`,
);
