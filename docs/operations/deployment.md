# Deployment and rollback

There is one long-lived hosted Supabase production project. CI uses disposable Supabase stacks. Vercel Preview is fixture-backed demo mode with signup, persistence, payment fulfilment, and report generation disabled.

Production changes require passing gates, a database backup, migration validation against a disposable clone, manual approval, additive migrations, application deployment, feature-flag enablement, and privacy-safe smoke tests. Roll back application code or disable flags; repair database state with forward migrations.

Required production secrets will eventually include Supabase URL/anon/service-role credentials, Stripe secret and webhook keys, OpenAI credentials, cron authentication, and the canonical application URL. Secrets are configured in provider stores and never committed.

## Supabase production project

- Project name: `celestial-atlas`
- Project ref: `jyguyvpbstskpuwqwrok`
- Region: London (`eu-west-2`)
- API URL: `https://jyguyvpbstskpuwqwrok.supabase.co`

Configure the Vercel Supabase Marketplace variables documented in `.env.example`; the application consumes those names directly. Do not expose a secret or service-role key. Set the Supabase Auth Site URL to `https://celestial-ledger.vercel.app` and add `https://celestial-ledger.vercel.app/auth/confirm` to the allowed redirect URLs. Local development may additionally allow `http://localhost:3000/auth/confirm`.

The application supplies the canonical production URL explicitly when creating a user. To honor that `emailRedirectTo` value, set the confirm-signup email template link to:

```html
{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

The three catalog products are deliberately inactive until Stripe and ephemeris release gates pass.
