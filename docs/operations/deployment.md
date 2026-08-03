# Deployment and rollback

There is one long-lived hosted Supabase production project. CI uses disposable Supabase stacks. Vercel Preview is fixture-backed demo mode with signup, persistence, payment fulfilment, and report generation disabled.

Production changes require passing gates, a database backup, migration validation against a disposable clone, manual approval, additive migrations, application deployment, feature-flag enablement, and privacy-safe smoke tests. Roll back application code or disable flags; repair database state with forward migrations.

Required production secrets will eventually include Supabase URL/anon/service-role credentials, Stripe secret and webhook keys, OpenAI credentials, cron authentication, and the canonical application URL. Secrets are configured in provider stores and never committed.

## Supabase production project

- Project name: `celestial-atlas`
- Project ref: `jyguyvpbstskpuwqwrok`
- Region: London (`eu-west-2`)
- API URL: `https://jyguyvpbstskpuwqwrok.supabase.co`

Configure `NEXT_PUBLIC_SUPABASE_URL` and the modern publishable key in Vercel. Do not expose a secret or service-role key. Configure Supabase Auth Site URL and allowed redirect URLs for the production domain and local development. For SSR email verification, set the confirm-signup email template link to:

```html
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

The three catalog products are deliberately inactive until Stripe and ephemeris release gates pass.
