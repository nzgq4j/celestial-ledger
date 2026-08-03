# Trust boundaries

- Browser input and calculated chart objects are untrusted.
- Geocoder output is external input and must be schema-validated.
- Supabase user sessions establish identity, not resource ownership; ownership is enforced again with RLS and server queries.
- Stripe redirect parameters never grant access. Only signed, idempotently processed webhook events create entitlements.
- Model output is untrusted content. It must match a strict schema, reference existing evidence, and pass safety validation.
- Worker and service-role credentials exist only in server secret stores.
- Preview deployments use fixtures and cannot access production data or fulfil payments.
