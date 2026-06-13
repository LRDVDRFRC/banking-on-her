# Sub-processor list

The third parties that process personal data on Unlockt's behalf to deliver the
sprint platform. Maintain this list; notify clients of changes per the DPA.

> Draft for review. Facts below were researched 2026-06-13 from official vendor
> sources. Items marked `⚠ CONFIRM` rest on search-level corroboration and must
> be verified by opening the cited page before this list is relied on in a
> contract.

| Sub-processor | Role | Processing location | Data it touches |
|---|---|---|---|
| **Anthropic, PBC** | AI processing (Claude API) | **US** | Interview text, document text, panel feedback (see `01_…`) |
| **Vercel Inc.** | Application hosting & serverless compute | **EU — Frankfurt (`fra1`)** (pinned) | All request/response data in transit; no primary store |
| **Turso (ChiselStrike, Inc.)** | Database (libSQL) | **EU — Ireland (`aws-eu-west-1`)** | The system of record: all sprint data at rest |

Underlying infrastructure for all three is **Amazon Web Services** (Vercel and
Turso run on AWS; Anthropic runs on AWS and Google Cloud).

---

## Anthropic (Claude API)

- **Role:** processor for commercial/API customers.
- **DPA:** offered, auto-incorporated into the Commercial Terms (clickthrough). Accept/keep on file. `⚠ CONFIRM` at privacy.claude.com.
- **Transfers:** DPA includes EU **SCCs** (+ UK addendum). `⚠ CONFIRM` exact module/version against the live DPA.
- **DPF:** `⚠ CONFIRM` — sources conflict; check dataprivacyframework.gov/list before stating.
- **Location:** US only on the first-party API; **no EU residency** option (EU only via Bedrock/Vertex — not used here).
- **Retention:** inputs/outputs auto-deleted within **30 days**; **30-day retention is mandatory on `claude-opus-4-8`** (no ZDR on this model); up to 2 years if a request is flagged for policy violation.
- **Training:** **does not train on commercial/API data.** ✓
- **Certifications:** SOC 2 Type II, ISO 27001:2022, ISO 42001 referenced. `⚠ CONFIRM` current set at trust.anthropic.com.
- **Sub-processors:** trust.anthropic.com/subprocessors (updated 2026-03-26). `⚠ CONFIRM` / pull live.
- **Encryption:** TLS in transit (HTTPS to api.anthropic.com); at-rest statement `⚠ CONFIRM` at trust.anthropic.com.

## Vercel

- **Role:** processor (hosting/compute).
- **DPA:** published at vercel.com/legal/dpa (Pro/Enterprise).
- **Transfers:** EU **SCCs** + UK addendum; **certified under the EU-US Data Privacy Framework.** ✓
- **Location:** default US, but **region-pinned to EU (Frankfurt `fra1`)** for this project via `vercel.json`. Note: Vercel backups are globally replicated; standard plans do not guarantee EU-only persistence — Enterprise "Secure Compute" if a client requires it.
- **Retention:** backups every 2h, retained 30 days, deleted with the instance. Application data retention is governed by our own config + the DPA.
- **Certifications:** SOC 2 Type 2, ISO 27001:2022, PCI DSS v4.0, HIPAA (Enterprise BAA), TISAX AL2. ✓
- **Encryption:** **AES-256 at rest, TLS 1.3 in transit.** ✓
- **Sub-processors:** security.vercel.com (Trust Center). `⚠ CONFIRM` / pull live.

## Turso (libSQL database)

- **Role:** processor (database).
- **DPA:** offered to EU customers on Scaler/Pro/Enterprise, **requested via the trust portal** (not clickthrough) — **must be actively obtained and kept on file before go-live.** trust.turso.tech.
- **Transfers:** `⚠ CONFIRM` — SCCs/DPF **not verified**. Turso is US-incorporated and runs the control plane; confirm the DPA's transfer clauses even though data-at-rest is in Ireland.
- **Location:** data pinned to **EEA — Ireland (`aws-eu-west-1`)**. ✓ `⚠ CONFIRM` whether control-plane/account metadata also stays in-region.
- **Retention:** database content persists until deleted (it's our database); deleting a database deletes its backups. No separate default TTL confirmed.
- **Certifications:** **SOC 2 Type II completed** (recent — confirm letter date at trust.turso.tech); HIPAA/BAA on Pro. ISO 27001 `⚠ CONFIRM`.
- **Encryption:** at rest by default (volume-level) plus optional native page-level encryption (AEGIS-256 / AES-GCM, keys in memory only, optional BYOK); TLS in transit (exact version `⚠ CONFIRM`). ✓

---

## Before go-live with a real client

1. Get all **three DPAs on file** (Turso's must be actively requested).
2. **Verify Anthropic's DPF status** (dataprivacyframework.gov/list) and the SCC versions in all three DPAs.
3. Pull each provider's **live sub-processor list** and diff against this table.
4. Confirm Turso's **transfer mechanism** (SCCs) explicitly.

Tracked in `09_open-items-and-decisions.md`.
