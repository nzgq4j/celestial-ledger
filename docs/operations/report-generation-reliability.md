# Personal report generation reliability

## Incident and scope

On 2026-09-02, Recovery Reflection jobs repeatedly produced a draft that failed
application validation and then exhausted a second 100-second provider request.
The final timeout hid the first validation result and left the account UI showing
a terminal failure while the database still scheduled automatic retries.

Career Purpose and Recovery Reflection use the same worker. This control applies
to both report types and does not change astronomical calculation, evidence,
entitlement consumption, report expiry, or recovery-language safety validation.

## Generation controls

- Each worker invocation makes one OpenAI Responses API request.
- The request uses low reasoning effort, a section-aware output-token ceiling,
  no SDK retries, and a 120-second client timeout.
- Automatic retries are limited to three claimed attempts. Diversity failures,
  authentication failures, quota exhaustion, and access failures remain terminal.
- Manual retry resets the attempt counter for the same owner-authorized report.
- Failure codes are normalized before persistence and logging. Provider messages,
  report prose, birth data, evidence IDs, and user identifiers are not logged.
- A failed row with a finite `next_attempt_at` and fewer than three attempts is
  presented as a queued automatic attempt. The UI polls less frequently while it
  waits for that timestamp, then returns to the active polling cadence. Terminal
  failures expose the manual retry action.
- Recovery narratives target 700-850 words. Provider output is constrained to at
  least 4,500 characters, while runtime validation allows a 450-word lower
  tolerance so an otherwise complete report is not discarded for a small word
  count variance. The 1,000-word ceiling and all recovery safety checks remain in
  force.

## Monitoring

Successful jobs log `Report worker completed job` with report type, attempt, and
duration. Retryable failures log `Report worker scheduled retry` with a stable
failure code. Terminal failures log `Report worker failed job`.

Investigate repeated `OPENAI_TIMEOUT`, `OPENAI_RATE_LIMIT`, or content-validation
codes by report type. Do not log or query birth-profile fields during incident
triage. Confirm queue health using aggregate report status and failure-code counts.

## Recovery and rollback

This change has no database migration. Application rollback is sufficient; queued
and failed report rows remain intact. Entitlements are consumed only when
`complete_report_job` succeeds. After rollback or forward repair, an owner can use
the existing retry action to restart a terminal report without creating another
entitlement.

## Release verification

1. Run formatting on changed files, typecheck, lint, the full Vitest suite, and a
   production build.
2. Run the dependency audit, licence inventory, and server ephemeris gate.
3. Verify a preview returns private report endpoints with `no-store` protections
   and does not expose worker details to unauthenticated callers.
4. After production deployment, inspect runtime errors and worker logs for new
   timeout, validation, authentication, quota, or access failures.
