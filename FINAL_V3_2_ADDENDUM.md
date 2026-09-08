# BhoomiIntel SIH Final v3.2

## Final hardening added

- Official DILRMP-MIS runtime connector remains the only source labelled official/live.
- Live source status and source catalogue endpoints: `/api/live/status`, `/api/live/sources`.
- Data provenance is explicit: official indicators vs platform analytical/model outputs.
- OCR bridge supports scanned PDFs/images when `ENABLE_OCR=true` and `pdftoppm` + `tesseract` are installed and configured with `PDFTOPPM_CMD` / `TESSERACT_CMD`.
- Scanned documents that cannot be OCR'd are marked `evidence_ready=false` rather than silently treated as valid evidence.
- Cross-document verification normalizes extracted fields and remains a review aid, not a legal determination.
- RAG fallback is evidence-only and no longer invents unsupported policy conclusions.
- AI is explicitly described as an assistant, not an official government authority.
- Policy simulations remain forecasts. They are never represented as official statistics.

## Live-data limitation

The DILRMP public portal does not expose a universal official parcel-level API for this prototype. Therefore the platform does not fabricate parcel boundaries or non-DILRMP indicators. Current district boundary geometry remains local prototype geometry unless replaced with an authoritative GIS dataset.

## OCR on Windows

Install Tesseract OCR and Poppler separately, then set:

```env
ENABLE_OCR=true
TESSERACT_CMD=C:\\Program Files\\Tesseract-OCR\\tesseract.exe
PDFTOPPM_CMD=C:\\path\\to\\pdftoppm.exe
```

If those tools are unavailable, text PDFs still work normally and scanned files are clearly flagged for OCR/manual review.


## DILRMP TLS fallback
The live connector first uses normal certificate-verified HTTPS. The official DILRMP host can intermittently expose a certificate-chain/hostname problem on Windows. For a controlled hackathon demo only, `DILRMP_ALLOW_INSECURE_TLS=true` enables a read-only fallback for the exact DILRMP host. Keep it `false` for production. The response explicitly reports when this fallback is enabled.
