# Fresh development checkpoint review

One fresh reviewer inspected the complete branch read-only. No Critical defect was identified in the enabled development scope; six Important defects required fixes. The reviewer ran nine non-database tests independently. The implementation's full suite separately verifies live local database boundaries.

| Finding | Change and evidence |
|---|---|
| Editor late responses / old preview | Local epoch + acknowledged snapshot fence; raw conversion compiles the current saved snapshot; destructive inputs lock; late checkpoints/reports detach; stale AI proposal cannot apply. Actual delayed-response browser regressions and controlled proposal fixture. |
| Worker wrong membership | Target workspace + current active workspace status and queued row lock. Real worker test failed with UNSAFE_URL before fix and now fails the unauthorized job with PERMISSION_REVOKED. |
| Cancellation race / allowance bypass | Row-locked queued cancellation refunds; running work becomes cancel_requested and keeps its reservation. Completion race and refund tests failed before fix, then passed. Unknown external costs require reconciliation. |
| Retry creates duplicate logical command | Exact command fingerprint retains an idempotency key across lost/malformed/5xx responses; next acknowledged intent gets a fresh key. Failed-then-passed client recovery test. |
| Supplied pinned spec overwritten | Latest brand defaults apply only to a blank draft. Real HTTP copied-spec equality failed before fix, then passed. |
| Previous workspace content retained | Workspace-tagged data and obsolete-read guard; child panels keyed by workspace. Same-route Billing switch failed before fix, then passed in Chromium. |

Former deferred minor resolved: cancelled/non-draft submit-review returns a state conflict, and the response comes from the actual updated row. HTTP regression failed with 200 before the fix and passes with 409; Chromium verified cancellation/reload.

Reviewer declined to certify unfinished GA modules; live AI quality/provider compatibility; remote ESP reconciliation/dispatch; production queue recovery/isolation; real-client/VML/comprehensive accessibility; Railway/image/remote CI/legal/procurement evidence. These remain required, not waived. See CAPABILITIES.md and RELEASE.md. This review is not an independent security assessment or launch signoff.

One new fresh reviewer inspected the audience slice and whole branch read-only, independently running nine focused tests. Findings were reproduced and fixed in a single pass:

| Finding | Change and evidence |
| --- | --- |
| Import operation result exposes recipients to Viewer/Editor | Type-specific audience permission before returning/cancelling a contacts.import operation. Actual HTTP role test failed with 200 before fix and passes with 403 for both roles. |
| Freeze silently selects a newer segment than the displayed version | Preview/freeze require the displayed expected version; conflicts preserve displayed rules. Actual stale freeze returned v2 for expected v1 before fix; HTTP and Chromium now reject with VERSION_CONFLICT. Replay of an already acknowledged same-key freeze still returns its original immutable snapshot. |
| Boolean No comparison cannot save | Comparison transition initializes the actual false value. Regraded Important because a normal typed-filter action could not complete with the value visibly selected. Chromium reproduced the failure, then verified false persisted and the segment saved. |

Final fix-pass suite: 23/23 tests and 14 HTTP groups pass. Reviewer declined production readiness, provider conformance, dispatch eligibility, DOI/topics, large-import capacity, recovery infrastructure and real-client/accessibility acceptance. These remain open obligations; no review substitutes for applicable GA gates.
