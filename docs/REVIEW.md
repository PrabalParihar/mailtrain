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

One fresh CSV reviewer reproduced two Important issues. One fix pass made consent conflict handling independent of row order: every conflicting row retains its bounded unverified claim, and the entire file refuses confirmation until resolved. Pure regression failed with one accepted row, then passed with zero; HTTP confirms the conflict fence and a repaired opt-out. Errors after the first 100 rows now have independent paginated detail. HTTP failed without the late error count, then passed; Chromium inspected row 102 and all 201 errors over three pages.

Deferred minor: a valid preview row's “Held without verified permission” wording describes the incoming unverified claim but can misstate an existing contact's actual subscribed/suppressed status. Confirmation counts and the contact safety table show actual state; improve preview wording/status classification before GA.

Reviewer set aside production worker capacity/recovery/providers/legal/DOI/full-GA acceptance and unsaved navigation policy. Raw unsubmitted CSV is not automatically persisted; an explicit navigation/reload guard preserves input when leaving is dismissed. Mobile viewport changes retain active-view input; confirmed contact changes survive navigation. A resumable server-side import draft remains separate full-GA work, not claimed by this test.

Recipient preferences fresh review: two Important findings, no Critical. One fix pass completed without rereview. Repeated global opt-out and later imported opt-out now invalidate pending re-opt-in even while already unsubscribed (real regression RED accepted stale proof -> GREEN rejected; suppression stays idempotent). Confirmation page query text no longer supplies success (real GET RED false recorded-success -> GREEN persisted pending state and confirmation button). Related arbitrary preference-saved query banners removed.
Reviewer declined provider delivery, received DKIM/RFC8058 proof, production dispatch integration/full release readiness and final visual polish. Those remain open; local Chromium mobile/offline/repeated-click evidence was completed separately. Accepted frequency slots currently age from reservation time; the future dispatch acceptance transition must record authoritative submission/acceptance time and test delayed submission before activation. Dispatch remains disabled.
