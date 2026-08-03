# Dependency advisory gate

Status: **blocked** as of 2026-08-02.

`npm audit --omit=dev` reports three high-severity transitive findings: PostCSS advisories through Next.js and libvips advisories through Sharp. The installed Next.js 16.2.12 dependency graph does not currently offer a complete non-breaking fix for the PostCSS findings. CI intentionally runs the audit so production release cannot silently ignore them.

Re-evaluate after upstream releases, update the lockfile, rerun the full verification suite, and document any time-bounded risk acceptance before production deployment.
