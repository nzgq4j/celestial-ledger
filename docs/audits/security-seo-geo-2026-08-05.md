# Celestial Atlas security, SEO, and GEO audit

**Audit date:** 5 August 2026
**Scope:** Next.js application code, public and private route boundaries, server actions and route handlers, AI generation boundaries, crawler discovery, public metadata, structured data, social previews, and multilingual discovery.

This is a code-level audit, not a penetration test or a substitute for continuous production monitoring. No production database mutation was required.

## Executive summary

The application already had strong foundations: strict runtime schemas on chart inputs, server-side astronomical calculation, server-only privileged clients, row-level ownership boundaries, signed Stripe webhooks, evidence-bound report schemas, private cache/indexing headers, and explicit account/report authorization. This pass corrected five material gaps and expanded discoverability across every public route.

The most important changes are:

1. Password-reset URLs now use the trusted canonical application URL instead of forwarded host headers.
2. Report deletion now requires same-origin requests and a valid UUID, matching the protections on report generation/retry.
3. OpenAI requests now place policy in the high-priority `instructions` field and serialize chart/report material as untrusted data. Embedded instructions in labels or input strings are explicitly ignored.
4. A site-wide Content Security Policy, HSTS, cross-origin opener policy, frame denial, MIME sniffing protection, strict referrer policy, and restrictive permissions policy are emitted from Next.js.
5. The public discovery layer now includes a complete page map, multilingual horoscope alternates, per-route metadata, public structured data, generated 1200×630 social images, and an expanded `llms.txt`.

## Security findings and disposition

| Severity | Finding                                                                                                                                                                       | Disposition                                                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| High     | Password reset constructed its callback from `x-forwarded-host`/`host`, allowing a poisoned reset destination if an upstream accepted attacker-controlled forwarding headers. | **Fixed.** Reset callbacks use `canonicalAppUrl()` only.                                                                                    |
| High     | Chart display strings and report prompt material shared the same model input channel as task instructions, leaving an avoidable prompt-injection boundary.                    | **Fixed.** Trusted rules use `instructions`; serialized input is explicitly untrusted data; report evidence validation remains mandatory.   |
| Medium   | `DELETE /api/reports/[id]` did not enforce the same-origin check already used by the retry endpoint; the shared check also relied on forwarded host values.                   | **Fixed.** Same-origin uses the request URL, rejects cross-site Fetch Metadata, and requires UUID validation before authorization/deletion. |
| Medium   | Browser hardening did not include CSP or HSTS.                                                                                                                                | **Fixed.** CSP, HSTS, COOP, frame denial, content-type, referrer, DNS-prefetch, and permissions policies are configured.                    |
| Low      | Geocoding accepted unbounded query strings and trusted the upstream JSON shape and coordinates.                                                                               | **Fixed.** 2–120 character validation, per-instance throttling, Zod validation, result cap, and geographic bounds are enforced.             |

### Existing controls verified

- Browser chart payloads are not trusted for private reports; report evidence is recalculated server-side.
- Astronomical facts remain deterministic application data and are not delegated to the language model.
- Report output is constrained by strict JSON schema, parsed again at runtime, and rejected if evidence IDs are missing or invalid.
- Private reports and daily readings are owner-authorized, `no-store`, `noindex`, and excluded from social sharing, sitemaps, robots discovery, and `llms.txt`.
- Supabase service credentials, OpenAI, Stripe, webhook, reCAPTCHA, and cron secrets remain server-only.
- Mutating browser APIs use same-origin checks; webhook and worker exceptions authenticate through signatures/secrets instead.
- Administrative access is resolved server-side from the `admin_roles` table, not user-editable metadata.

### Residual security risks and recommended follow-up

1. **Distributed rate limiting:** current limits are in-memory and therefore per instance. Before material traffic, move interpretation, chart, geocode, authentication-adjacent, and report-start throttles to a shared durable store or edge firewall.
2. **CSP maturity:** the policy retains `'unsafe-inline'` for framework/runtime compatibility. Introduce nonces and remove it after browser regression testing, especially around Next.js scripts, analytics, and reCAPTCHA.
3. **Production verification:** add automated dynamic application security testing, dependency alerts, Supabase RLS integration tests against a disposable project, and alerting for repeated authorization failures, report validation failures, and anomalous AI spend.
4. **Administrative assurance:** require MFA for administrative users in the identity provider and periodically review `admin_roles` and privileged audit records.
5. **Privacy operations:** validate one-year report expiry and deletion jobs in production observability; do not add birth details or report content to analytics events.

## SEO audit

### Page map and indexability

Every public page now has a specific title, meta description, canonical URL, keyword set, Open Graph metadata, Twitter/X large-image card, and index/follow policy. Auth, account, administration, natal-profile, private report, and private daily-reading pages are explicitly `noindex`.

Public map:

- Home and natal-chart entry point
- Daily horoscope collection and all twelve sign detail pages
- Weekly readings
- Personal report catalogue
- Membership plans
- Sample library, daily sample, career sample, recovery sample, and weekly sample
- Astrological method and ephemeris
- Celestial Journal index and every published article
- Privacy and terms

The sitemap no longer assigns a false “modified now” timestamp to every static page. Daily horoscope resources receive a daily last-modified date, journal entries use their stored update date, and static pages use appropriate change frequencies without fabricated modification dates.

### Multilingual discovery

English, Spanish, French, and German variants of the home and public horoscope experience receive `hreflang` alternates, self-references, and `x-default`. The server reads an explicit `lang` query before cookie preference so crawlers and shared links receive the selected language in the initial HTML.

**Architectural recommendation:** migrate public localized content to stable path-based URLs such as `/es/horoscopes/aries`. Google recommends distinct locale URLs and notes that locale-adaptive pages based on cookies or browser language may not be fully crawled. Query parameters make the current variants discoverable, but language subpaths are the stronger long-term information architecture.

References:

- [Google: managing multi-regional and multilingual sites](https://developers.google.com/search/docs/advanced/crawling/managing-multi-regional-sites)
- [Google: localized versions and hreflang](https://developers.google.com/search/docs/advanced/crawling/localized-versions)
- [Google: sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)

### Social and article presentation

- Each Sun-sign detail has a generated 1200×630 image and share actions for Facebook, X, Pinterest, email, and direct-link copying.
- Each published journal entry has a generated featured image rendered in the journal index and article, then reused for Open Graph and Twitter/X cards.
- Journal entries emit `BlogPosting` JSON-LD with headline, description, image, dates, author, publisher, and canonical main entity.
- Daily sign pages emit public `Article` JSON-LD. The organization and website graph is emitted once at the root.
- Image alternative text is provided both in metadata and rendered markup.

References:

- [Open Graph protocol](https://ogp.me/)
- [Google Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Google Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization)
- [Pinterest Save button parameters](https://developers.pinterest.com/docs/web-features/buttons/)

### SEO follow-up

1. Connect Search Console coverage reporting and monitor excluded alternate URLs, structured-data validity, canonical selection, and Core Web Vitals.
2. Add breadcrumb structured data when the journal and report catalogue gain deeper taxonomy.
3. Give editors optional custom social-image uploads in addition to the generated fallback when a durable media store is selected.
4. Introduce locale subpaths before translating the English-only weekly, reports, membership, samples, method, journal, and legal content.

## GEO and LLM discoverability audit

`/llms.txt` follows the Markdown-oriented LLM discovery convention with one H1, an organization summary blockquote, descriptive links, supported languages, all twelve daily sign routes, complete samples, dynamic published journal links, policy pages, and citation guidance. It excludes private routes and explicitly tells systems not to infer or request private birth, account, purchase, or report data.

The public semantic layer now provides:

- Organization and WebSite entities at the site root
- Article entities for public daily sign readings
- BlogPosting entities for journal articles
- Descriptive canonical page metadata rather than repeated generic copy
- A revised sitemap that mirrors the public information architecture
- Explicit crawler access to public pages while consistently blocking private paths

GEO should be evaluated through citation accuracy and qualified referral traffic, not a promise of inclusion in a model answer. The strongest continuing strategy is to publish original, clearly authored journal material, retain evidence-linked calculation methodology, maintain consistent entities, and keep public facts accessible in HTML rather than client-only state.

## Release verification checklist

- [x] Changed-file format check (the pre-existing repository-wide format check remains red outside this change set)
- [x] Typecheck
- [x] Lint
- [x] Unit/integration tests (93 passed)
- [x] Production build
- [x] Dependency security audit (0 known vulnerabilities)
- [x] License review
- [x] Ephemeris golden-fixture gate
- [ ] Accessibility/browser smoke test
- [x] Local HTTP smoke test for public pages, metadata, headers, discovery files, and generated social images
- [ ] Confirm live `/robots.txt`, `/sitemap.xml`, `/llms.txt`, social images, and locale alternates after deployment
