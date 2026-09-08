# BhoomiIntel v3 – SIH Final Edition additions

This release adds an **Intelligence Center** on top of the existing BhoomiIntel platform.

## New capabilities
- Cross-document verification for 2–6 published repository documents.
- Field-level conflict detection for applicant/owner, survey number, land area, district and document date.
- Explainable district risk indicators combining digitization gap, dispute burden and climate vulnerability.
- Early-warning cards for high backlog, low digitization and high vulnerability.
- AI plain-language explanations for district metrics.
- AI audit logging for explanation requests.
- Fixed policy-simulation ownership persistence so newly created simulations are tied to the signed-in user.

## Important transparency note
The risk score is an analytical indicator generated from the included sample dataset. It is **not an official government risk rating**. Document verification is a first-pass extraction-based check and must not replace official human verification.

## v3.2.1 Live DILRMP parser fix
- Tries official DILRMP-MIS 4.0 first and validates that usable KPI/master data was actually parsed.
- Falls back to the official DILRMP-MIS 3.0 cumulative physical-progress page when MIS 4.0 HTML is a client-rendered shell.
- Parses current national KPIs and official district rows without fabricating values.
- Uses Windows curl with the OS certificate store as an HTTPS transport fallback.
- Updated stale Claude 3.5 UI labels to generic/current server-side Claude wording.


## v3.2.3 live connector hardening
- National DILRMP report requests are fetched concurrently.
- Legacy DILRMP cumulative district table gets a longer 120-second timeout.
- SRO KPI parser now prefers labelled official values and rejects tiny unrelated numeric columns.
- Legacy homepage can supply SRO KPI and master counts when available.
- No synthetic district or SRO values are substituted.
