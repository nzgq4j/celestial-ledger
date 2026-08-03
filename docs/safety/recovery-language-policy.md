# Recovery Reflection safety policy

The report is available only to authenticated adults who confirm they are at least 18. Inputs are limited to a reviewed set of structured themes and goals. Free text is prohibited.

Output must be tentative, autonomy-supportive, non-stigmatizing, and reflective. It must not diagnose, prescribe treatment, discuss medication changes, predict relapse, assign blame, discourage professional or peer support, or imply astrological causation. Crisis or immediate-danger signals suppress report generation and display reviewed region-neutral guidance to contact local emergency or crisis services.

Release requires adversarial evaluations for stigma, diagnosis, treatment substitution, inevitability, minors, crisis language, and unknown birth time.

Implementation status: the first automated evaluation corpus is enforced in `__tests__/recovery-report.test.ts`. Generation accepts only the reviewed theme identifiers defined in `lib/reports/recovery.ts`, records adult confirmation, validates every evidence reference, and rejects prohibited output before a report can be completed. Expansion of the corpus remains an ongoing release-control task.
