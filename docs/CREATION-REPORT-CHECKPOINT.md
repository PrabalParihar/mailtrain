# Bounded creation activity reporting

This ordinary reporting increment implements the Reports screen using already durable creation operations. Source: PRD v2.0 REQ-042–044, its distinction between observed evidence and inferred analytics, and section 6.7/JRN-01. Baseline A remains all 65 requirements and all 13 release gates. No full requirement or release gate is accepted by this feature.

## Delivered behavior

`/app/reports` shows a selected brand-extraction or email-generation cohort, its recorded operation states, daily creation buckets and measured time to successful completion. The initial window is the most recent 30 UTC calendar days including today. Filters specify an inclusive UTC start, exclusive UTC end and supported IANA display timezone. The window must be positive, at most 31 elapsed UTC days and within years 2000–2100. Display timezone affects daily buckets and observation-time display, never the cohort cutoff. Some local boundary days therefore cover only part of a day.

`GET /v1/operations/report` requires exactly `type`, `created_after`, `created_before`, `time_zone`. Existing authenticated operation-history contracts apply: session roles with `read`, or API keys with `brands:read` for `brand.extract` and `emails:read` for `email.generate`. This adds no role, grant, database migration or alternate authority path. API/SDK operation `getCreationActivityReport` documents the same bounded response.

One SQL statement observes the cohort consistently at `generated_at`. States are the current durable states of operations **created** within the window, not terminal events that occurred during it. Counts include queued, running, succeeded, failed, cancelled, cancellation requested and other recorded states. Every local calendar date touched by the UTC window appears, including zero-count dates; there are at most 33. Daily counters reconcile with the summary. History changes can change a later refreshed snapshot; this is not historical daily state reconstruction.

Median and p90 use successful operations with a non-null `completed_at >= created_at`. Duration is `completed_at - created_at`, including queue time. Missing or invalid completion stamps are excluded from percentiles and counted separately. No usable samples means `null`/“Unavailable,” never zero latency. Percentiles use PostgreSQL continuous interpolation. There is no provider-latency, reviewer-time or end-to-end human journey claim.

The form keeps its editable selection distinct from the displayed snapshot. Apply/refresh admits one request synchronously; pending/error states remove stale results; errors preserve filter input. Navigation/workspace/account changes fence and abort late reads. An edited selection disables CSV until an exactly matching snapshot loads. Empty windows show no recorded operations and unavailable timings.

## CSV contract

“Download report CSV” serializes the exact displayed aggregate snapshot into a small browser download. There is one header, one summary and at most 33 day rows; it is not a bulk extraction, background report job or live campaign analytics export. The summary alone contains completion statistics. Daily completion-statistic cells are blank because daily timing was not measured.

UTF-8, CRLF, RFC-style quoted/doubled string cells. Formula-leading cells (including whitespace/control prefixes before `=`, `+`, `-`, `@`) receive a literal apostrophe and quotation. Columns, in order:

`schema_version`, `generated_at`, `operation_type`, `created_after_utc`, `created_before_utc`, `display_time_zone`, `row_kind`, `local_date`, `total`, `queued`, `running`, `succeeded`, `failed`, `cancelled`, `cancel_requested`, `other`, `completion_sample_count`, `completion_missing_count`, `median_completion_ms`, `p90_completion_ms`.

`row_kind` is `summary` or `day`. Summary `local_date` is blank. Both percentile cells are blank when unavailable. All times except `local_date` are UTC instants; local dates use the explicitly exported display timezone. There are no operation/contact/actor IDs, addresses, prompts, message bodies, credentials, provider results or suppressed personal fields. No revenue or usage-price inference.

## Validation and qualification limits

New domain tests first failed for missing reporting contracts. Domain/real disposable-DB tests then passed for UTC range validation, missing timing, end cutoff, timezone day boundaries across DST, counter coherence, formula-safe CSV and unchanged source rows. Focused inherited API/SDK tests, lint, typecheck, generated-contract checks and production build pass.

The owned actual HTTP/Chromium smoke exercises persisted synthetic operations, empty/required window, invalid and unavailable reads, filter preservation/retry, same-turn repeated click, exact displayed-snapshot download, late navigation isolation, workspace replacement, ordinary Viewer read and 320/390px usability. The rendered mobile pixels were inspected. No external provider, external request, campaign send or product mutation is part of this report. Its owned app and disposable database are stopped/removed. It is included in CI; publication evidence and exact-head CI are reported in delivery rather than presumed here.

REQ-042 still needs verified provider events and counters within 60 seconds p95, unique/total definitions, late/duplicate/reordered evidence and uncertainty policy. REQ-043 still needs approved tracking, raw versus filtered clicks, unreliable-open labeling, attribution and verified destination analytics links. REQ-044 still needs asynchronous bulk/live analytics export, approved retention/entitlements and applicable production acceptance. Generic product funnel events, draft/export journey distributions, conversions, real-client/device/geography observations and revenues have not been collected by this feature and remain unavailable.

The separately paused collaboration/security qualification is not resumed or qualified here. All inherited launch gates remain closed pending the evidence in `PRODUCTION-LAUNCH-CHECKLIST.md`. No production deployment or paid commitment is made.
