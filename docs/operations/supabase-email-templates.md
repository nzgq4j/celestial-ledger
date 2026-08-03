# Supabase authentication email templates

Celestial Atlas uses a single branded template system for all six authentication emails and all seven optional security notifications supported by hosted Supabase Auth.

The source of truth is [`scripts/configure-supabase-email-templates.mjs`](../../scripts/configure-supabase-email-templates.mjs). It uses the public production logo at `https://www.celestialatlas.app/celestialatlas-logo.png`, the Celestial Atlas navy, ivory, and antique-gold palette, responsive table-based email markup, and server-side confirmation links. Manual-paste artifacts are indexed in [`supabase-email-templates/SUBJECTS.md`](supabase-email-templates/SUBJECTS.md).

## Manual dashboard configuration

Open [`supabase-email-templates/SUBJECTS.md`](supabase-email-templates/SUBJECTS.md), then open each linked HTML artifact. In **Supabase > Authentication > Emails**, select the matching template and paste its subject and complete HTML body. Save one template at a time.

The optional security notification artifacts do not change their corresponding enable/disable toggles.

## Included templates

| Supabase template           | Subject                                                  |
| --------------------------- | -------------------------------------------------------- |
| Confirm sign up             | Confirm your Celestial Atlas account                     |
| Invite user                 | You’re invited to Celestial Atlas                        |
| Magic link or OTP           | Your Celestial Atlas sign-in link                        |
| Change email address        | Confirm your new Celestial Atlas email address           |
| Reset password              | Reset your Celestial Atlas password                      |
| Reauthentication            | `{{ .Token }}` is your Celestial Atlas verification code |
| Password changed            | Your Celestial Atlas password was changed                |
| Email address changed       | Your Celestial Atlas email address was changed           |
| Phone number changed        | Your Celestial Atlas phone number was changed            |
| Sign-in method linked       | A sign-in method was linked to Celestial Atlas           |
| Sign-in method removed      | A sign-in method was removed from Celestial Atlas        |
| Verification method added   | A verification method was added to Celestial Atlas       |
| Verification method removed | A verification method was removed from Celestial Atlas   |

## Safe publication

The Supabase database connector cannot change Auth service templates. Hosted templates are configured through the Supabase Dashboard or the Supabase Management API. The checked-in script uses the Management API so the complete configuration is reproducible and reviewable.

1. Create a short-lived personal access token in **Supabase Account > Access Tokens**. Do not paste it into chat or commit it.
2. Set it only in the current terminal session as `SUPABASE_ACCESS_TOKEN`.
3. Preview the operation:

   ```powershell
   node scripts/configure-supabase-email-templates.mjs
   ```

4. Publish the templates:

   ```powershell
   node scripts/configure-supabase-email-templates.mjs --apply
   ```

5. Remove the token from the terminal session after publication.
6. In **Authentication > Emails**, review each template and send test emails for confirmation, recovery, and reauthentication before enabling optional security notifications.

The script deliberately updates only subjects and HTML content. It does not enable or disable any security notification. Those toggles remain an explicit project-owner decision.

## Link contract

Authentication buttons go directly to the application’s server route using `{{ .TokenHash }}` and the appropriate Supabase OTP type:

```text
https://www.celestialatlas.app/auth/confirm?token_hash={{ .TokenHash }}&type=...
```

Password recovery also supplies `next=/auth/update-password`. This matches the application route contract and avoids putting sessions in URL fragments.

Supabase Auth Site URL must remain `https://www.celestialatlas.app`. The allowed redirect list must include `https://www.celestialatlas.app/auth/confirm`; local development may additionally allow `http://localhost:3000/auth/confirm`.

## Operational notes

- Configure custom SMTP before production launch; Supabase’s built-in email service is rate-limited and intended for evaluation.
- Disable provider-side link tracking because rewritten authentication links can fail.
- Some corporate mail scanners prefetch single-use links. If this becomes a support issue, move confirmation and recovery to a user-entered OTP flow rather than weakening token security.
- The template does not attempt name personalization because account registration currently collects only email and password. Add a reviewed display-name field before referencing user metadata in email copy.
