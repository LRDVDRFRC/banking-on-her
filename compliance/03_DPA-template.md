# Verwerkersovereenkomst (Data Processing Agreement) — template

> **NOT A SIGNED CONTRACT. NOT LEGAL ADVICE.** This is a drafting starting point
> built to GDPR Art. 28. A processor agreement is a binding legal instrument —
> **a privacy lawyer must review and adapt it before either party signs.**
> Brackets `[…]` are fields to complete. Many clients will prefer their own DPA
> template; this exists so you can respond fast and negotiate from a position of
> readiness, not from a blank page.

---

**Verwerkersovereenkomst** between:

- **[Client legal name]**, the **Controller** ("Verwerkingsverantwoordelijke"); and
- **[Unlockt legal entity name, KvK no.]**, the **Processor** ("Verwerker").

This agreement supplements the services agreement dated [date] (the "Main
Agreement") and governs the Processor's processing of personal data on the
Controller's behalf in delivering the Gender Capital Lab™ Sprint platform.

### 1. Scope & instructions
1.1 The Processor processes personal data only on the Controller's documented
instructions, including the processing set out in **Annex 1**, unless required
otherwise by EU or Member State law (in which case it informs the Controller
first, unless the law prohibits this).
1.2 The Processor informs the Controller if, in its opinion, an instruction
infringes the GDPR.

### 2. Confidentiality
The Processor ensures persons authorised to process the data are bound by
confidentiality.

### 3. Security
The Processor implements appropriate technical and organisational measures per
GDPR Art. 32, as set out in **Annex 2**.

### 4. Sub-processors
4.1 The Controller gives general authorisation for the sub-processors listed in
**Annex 3**.
4.2 The Processor informs the Controller of intended additions or replacements,
giving the Controller [14] days to object on reasonable data-protection grounds.
4.3 The Processor imposes the same data-protection obligations on each
sub-processor by contract and remains liable for their performance.

### 5. Data-subject rights
The Processor assists the Controller with appropriate technical and
organisational measures, insofar as possible, to respond to data-subject
requests (Art. 12–23), and forwards any request it receives directly to the
Controller without undue delay.

### 6. Assistance
The Processor assists the Controller in ensuring compliance with Art. 32–36
(security, breach notification, DPIA, prior consultation), taking into account
the nature of processing and the information available to it.

### 7. Personal-data breaches
The Processor notifies the Controller without undue delay and at the latest
within **[24 / 48] hours** of becoming aware of a personal-data breach, with the
information the Controller needs to meet its Art. 33/34 obligations.

### 8. Return & deletion
On termination, at the Controller's choice, the Processor deletes or returns all
personal data and deletes existing copies, unless EU/Member-State law requires
storage. The Processor's deletion process and timelines are described in
`04_retention-and-deletion.md`.

### 9. Audits & information
The Processor makes available to the Controller information necessary to
demonstrate compliance with this agreement and Art. 28, and allows for and
contributes to audits, including inspections, conducted by the Controller or an
auditor it mandates ([reasonable notice; once per year unless an incident]).

### 10. International transfers
10.1 The Processor and its sub-processors transfer personal data outside the EEA
only with appropriate safeguards (Art. 46), principally **Standard Contractual
Clauses**.
10.2 The Controller acknowledges that AI processing is performed by **Anthropic
in the United States** under SCCs, as described in `01_data-flow-and-residency.md`
and `02_subprocessor-list.md`, with no use of data for model training and a
30-day deletion window.

### 11. Liability, term, governing law
Liability follows the Main Agreement. This agreement runs for the term of the
Main Agreement. Governed by **[Dutch] law**; disputes before the courts of
**[Amsterdam]**.

Signed: Controller ___________  Processor ___________  Date _______

---

## Annex 1 — Processing details

- **Subject matter:** delivery of the Gender Capital Lab™ Sprint platform.
- **Duration:** the term of the Main Agreement.
- **Nature & purpose:** intake, diagnostic analysis, AI-assisted research and
  concept/prototype generation, and capture of test-panel feedback.
- **Types of personal data:** names and roles of client crew; their free-text
  intake and interview answers; self-assessment responses; the contents of
  documents the crew uploads; test-panel participants' first name, age band,
  scores and verbal feedback.
- **Categories of data subjects:** the client's employees (crew); persons
  referenced in uploaded documents; consumer test-panel participants.
- **Special categories:** none intended. Controller instructs crew not to upload
  special-category data.

## Annex 2 — Technical & organisational measures
See `05_security-measures-TOMs.md` (incorporated by reference).

## Annex 3 — Sub-processors
See `02_subprocessor-list.md` (incorporated by reference): Anthropic (US, AI),
Vercel (EU-Frankfurt, hosting), Turso (EU-Ireland, database).
