# Email setup (Supabase Auth)

Celestial Atlas sends its account emails through Supabase Auth: sign-up
confirmation, the 6-digit sign-in code, password reset, email change and
security notices. Templates, the sender and allowed links are set in the
Supabase dashboard for project `jyguyvpbstskpuwqwrok`. The Supabase connector
used by Claude cannot change these settings, so they are applied by hand or with
`scripts/configure-supabase-email-templates.mjs --apply` and a personal access
token.

## 1. Sender (Resend SMTP)

Supabase's built-in sender is for testing only: the project is limited to 2
emails an hour and delivery may be restricted to team members. Production uses
Resend.

1. **Domain.** In Resend, **Domains > Add domain** `celestialatlas.app`. Resend
   lists DNS records: an MX and an SPF TXT record on the `send` subdomain and a
   DKIM TXT record at `resend._domainkey`. Add them in Vercel (**Domains >
   celestialatlas.app > DNS Records**), which hosts the domain's DNS. They do
   not touch the existing root MX and SPF records of the current mailbox. Wait
   for Resend to show the domain as **Verified**.
2. **API key.** In Resend, **API Keys > Create API key** with **Sending access**,
   limited to `celestialatlas.app`. Copy it; Resend shows it once.
3. **Supabase.** **Authentication > Emails > SMTP Settings**, turn on **Enable
   custom SMTP** and enter:
   - Sender email: `no-reply@celestialatlas.app`
   - Sender name: `Celestial Atlas`
   - Host: `smtp.resend.com`, port `465`
   - Username: `resend`
   - Password: the Resend API key (enter it only here, never in chat or git)
4. **Rate limit.** **Authentication > Rate Limits**: raise **emails sent per
   hour** (for example to 100) once custom SMTP is on.

## 2. Links

**Authentication > URL Configuration**:

- Site URL: `https://www.celestialatlas.app`
- Redirect URLs: `https://www.celestialatlas.app/**` and
  `https://celestialatlas.app/**`

Email links go to `/auth/confirm`, which passes the token to the app in the URL
fragment (never sent to a server). The Android app signs in with the 6-digit
code, so it needs no extra redirect URL.

## 3. Templates

The branded templates are in `supabase-email-templates/`; `SUBJECTS.md` lists
each dashboard template with its subject line.

For each row in `SUBJECTS.md`:

1. Open **Authentication > Emails > Templates** and choose the template named in
   the first column.
2. Paste the subject from the second column.
3. Switch the body to source/HTML, replace it with the full contents of the
   matching `.html` file, and save.

The **Magic link or OTP**, **Confirm sign up** and **Reauthentication**
templates must keep `{{ .Token }}`: the app asks for that 6-digit code.

To regenerate the files after editing the script:

```bash
node scripts/configure-supabase-email-templates.mjs --export
npx prettier --write docs/operations/supabase-email-templates
```

## 4. Check

1. In the app, open **Account**, tap **Sign in**, choose **Email code**, enter
   an address you can read and tap **Email me a code**.
2. The email should arrive within a minute from `no-reply@celestialatlas.app`,
   branded, with a 6-digit code. Enter the code in the app.
3. Try **Forgot password?** once and follow the link: it should open the app and
   ask for a new password.

If nothing arrives, check **Authentication > Logs** for SMTP errors and the
provider's dashboard for bounces.
