# Integration registry qualification evidence correction

The ONE whole-plan review at product HEAD `8f686578cd6fce2488bac4423f65f89feecc32c8` reported 0 Critical, 1 Important, 0 Minor findings. I1 concerns crash-proof provenance ordering; no production SQL, domain schema, or server-wrapper defect was identified. This correction repairs that evidence receipt and removes one verified redundant generated scratch bundle. Product code is unchanged. A root-owned scoped correction review follows; this document does not declare canonical acceptance or release readiness.

## Crash receipt correction

The harness previously calculated its manifest inside `try`, before `finally` captured the successful container log. Its saved container entry therefore described an earlier failed run. The corrected harness calculates all log byte counts and hashes only after `finally` successfully captures `postgres-container.log` and completes ownership-checked container, volume, and network cleanup. A failed log capture or cleanup prevents receipt finalization.

The current successful run was not repeated. The corrected receipt was rebuilt from the existing six retained logs after exact stage PASS checks, 35 applied migrations, retained first migration failure, and ordered interrupted-shutdown/automatic-WAL-redo/recovered-readiness checks. The receipt retains its original source HEAD, container/image identity, cleanup flag, and all qualification claims. Only the container log entry's bytes/hash change; the other five entries are byte-for-byte metadata matches.

| Artifact | SHA-256 |
|---|---|
| Original helper, preserved `/tmp/lettercape-integration-registry-correction-before-harness.py` | `c8e76f8b8a49dbfc9e8b52fb8e3a3538da0fec77018f392319f38c780fb04244` |
| Corrected `/tmp/lettercape-integration-registry-crash-qualify.py` | `9d95dce354041a2139c733d8a34e6b37ed479b5e7321b7ae7192065e38b404d1` |
| Original receipt, preserved `/tmp/lettercape-integration-registry-correction-before-proof.json` | `84c09fb82a040be520fa043280606bf1aa8c6797a1a7b36d0cc364a0c293470d` |
| Corrected `/tmp/lettercape-integration-registry-crash-proof.json` | `2222f92f22fb2c31b4d2653820b3dc9da31ddc7480019b2b0876839d67a51bd7` |

The stale `postgres-container.log` entry is 4979 bytes / SHA-256 `49eb4b5abf6f81e28e77eadc53f0f4e363a1cf141f211bb1963fa31097a7792a`, exactly matching retained `failed-after-actual-crash/postgres-container.log`. The successful run's current log is 4992 bytes / SHA-256 `90bd9b5aa3fc4407b67bfa61d655a11702f4aa62f209c884f961a206554bd3a7`. Both logs, the old receipt, and earlier failure provenance remain retained. `/tmp/lettercape-integration-registry-correction-retained-logs/` contains additional exact copies; no original run log was overwritten.

Corrected receipt entries, all verified:

| Log in `/tmp/lettercape-integration-registry-crash-logs/` | Bytes | SHA-256 |
|---|---:|---|
| `migrate.log` | 1118 | `0b877eebefea5339a4dcda979a846a3019777ab8da8f953f2eeff64a3715694a` |
| `migration-first-failure.log` | 754 | `9f1c4e88508477a6e39633026d0bdfb621299eb7503bf5c16514efca53ebde9b` |
| `pending.log` | 101 | `96914729786dbf932a2e4b22c20638976b42e3adf15de375dc81ae431b6fef40` |
| `postgres-container.log` | 4992 | `90bd9b5aa3fc4407b67bfa61d655a11702f4aa62f209c884f961a206554bd3a7` |
| `seed.log` | 111 | `03715ac3068be0b240b0a14fa80935088e7622ec1227dc22d58cd1b5f088dbba` |
| `verify.log` | 219 | `be454399fc76db3611c9200570275f9a029ccdecd9ca350a8881b34a1d8d6ef3` |

The exact helper delta is retained at `/tmp/lettercape-integration-registry-correction-harness.diff`; the reconciliation script is `/tmp/lettercape-integration-registry-correction-reconcile.py`. The helper syntax/order check and six-log reconciliation both exit 0. This corrects traceability of an existing result; it is not a newly executed crash qualification.

## Generated scratch and lint

The earlier native lint result remains retained: exit 0, 0 errors, 142 warnings, all in `.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/domain-browser-bundle.mjs`. Before removing this untracked owned scratch file, its full bytes matched the retained copy at `/tmp/lettercape-integration-registry-task-logs/task-2-evidence/domain-browser-bundle.mjs`: 756628 bytes / SHA-256 `9d2cb3712cab1647d8b3c7f028a71fedc0f3c37dd410c0b9e1e48b382f1384b3`. Only the redundant scratch file was removed; the retained copy remains unchanged. No lint configuration, source warning, or product file was changed or suppressed.

Fresh `npm run lint` exited 0 with zero errors and zero warnings. Its log is `/tmp/lettercape-integration-registry-correction-lint.log`, SHA-256 `177e308fb34c67e35b7e5d386753d3db49bdb519b9ccb1b1f223066b4372f746`. The old warning-bearing native log and original native manifest remain unchanged; this clean result is supplemental evidence rather than a relabeled earlier run.

## Product and qualification boundary

All 511 tracked non-documentation files match both their pre-correction live bytes and reviewed product HEAD. All nine native proof logs and six Linux proof logs still match their existing manifests. Full suite/type/build/API/browser/Linux qualification was not repeated. Those existing results remain reusable for this evidence-only correction. The corrected helper lives outside the product tree; this commit adds only this documentation file. The root-owned dirty Task3 plan remains outside this commit.

Full65 BaselineA/all13 GA gates/zero whole accepted persist; REQ040/REQ036 remain incomplete. The registry is unmounted, can_export remains false, and credentials remain opaque references. No OAuth, provider call, credential resolution, export worker, public route, send, spend, push, or deploy was introduced. The crash fixture's uniquely owned bridge allowed outbound routing; loopback publication/provider trapping does not establish network-none isolation. No production restore/release acceptance or original shared PostgreSQL stop/write is claimed.

Complete commands, exact helper diff, preserved artifacts, proof/log hashes, immutable-product evidence and remaining limits are recorded in `/tmp/lettercape-integration-registry-correction-report.md`. Root must retain that correction report alongside the original whole review and the ONE scoped correction review before canonical qualification is declared complete.
