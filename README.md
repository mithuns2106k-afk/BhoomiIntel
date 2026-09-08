# BhoomiIntel

**AI-enabled National Research and Policy Innovation Platform for Land Governance**

BhoomiIntel is a functional full-stack land-governance intelligence platform aligned with Smart India Hackathon Problem Statement 26019 (Ministry of Rural Development, Department of Land Resources).

## Core workflow

**Evidence → Document Intelligence → Grounded AI Search → GIS Context → Policy Simulation → Decision Support → Auditability**

## Implemented

- Secure login with researcher, policymaker and public roles
- Server-enforced role permissions
- PDF/TXT/MD document ingestion
- Persistent extracted text and retrieval chunks
- Hybrid lexical + local vector retrieval
- Claude-grounded research synthesis and citations
- GIS district explorer with GeoJSON and multiple indicators
- Policy simulation with baseline/projection/risk/assumptions
- Research Assistant for multi-document synthesis
- Persistent research reports
- Simulation history
- AI audit logs
- Dashboard and analytics
- Responsive React/Tailwind interface
- Production frontend build serving support from Express
- Configurable Claude model and API URL
- AI transparency badges and sample-data disclosure

## Development accounts

These are seeded development credentials only:

| Role | Email | Password |
|---|---|---|
| Researcher | researcher@bhoomiintel.local | Research@123 |
| Policymaker | policymaker@bhoomiintel.local | Policy@123 |
| Public Viewer | public@bhoomiintel.local | Public@123 |

Change/remove these before any real deployment.

## Run locally

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown by the terminal, normally `http://localhost:3000`.

The Vite development server proxies `/api` and `/data` to the backend.

## Environment

Backend `.env`:

```env
PORT=5000
FRONTEND_URL=http://localhost:3000
ANTHROPIC_API_KEY=
CLAUDE_MODEL=claude-sonnet-4-6
JWT_SECRET=replace-with-a-long-random-secret
DATABASE_PATH=
UPLOAD_DIR=
```

Frontend `.env`:

```env
VITE_API_URL=/api
```

The Anthropic key is server-side only.

## Production website

Build the frontend:

```bash
cd frontend
npm run build
```

Then run the backend:

```bash
cd backend
npm start
```

Express serves `frontend/dist` when that directory exists, so the application can be deployed as a single web service.

For a multi-service deployment, set `VITE_API_URL` to the public backend API base and configure `FRONTEND_URL` on the backend.

### Storage note

The current core architecture uses SQLite and local document storage. This is suitable for a single persistent server. For horizontally scaled production, migrate SQLite to PostgreSQL and local uploads to S3-compatible object storage.

## API

### Authentication

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/register`

### Documents

- `GET /api/documents`
- `GET /api/documents/:id`
- `POST /api/documents/upload`
- `PATCH /api/documents/:id/publish`
- `DELETE /api/documents/:id`

### Intelligence

- `POST /api/search`
- `POST /api/simulate`
- `GET /api/simulate`
- `GET /api/simulate/:id`
- `POST /api/research-assistant`
- `POST /api/research-assistant/reports`
- `GET /api/research-assistant/reports`

### GIS / analytics

- `GET /api/districts`
- `GET /api/districts/:id`
- `GET /api/dashboard-metrics`
- `GET /api/analytics/trends`
- `GET /api/health`

## AI grounding and transparency

Research search is instructed to use only retrieved repository excerpts and to identify evidence gaps rather than inventing facts.

Every AI result is marked as AI-generated. If the Claude API is unavailable, the application can use clearly labeled deterministic fallback behavior where supported; fallback output must never be represented as a Claude response.

Policy simulation is decision-support, not a validated econometric forecast. Results display assumptions, risks and confidence and include the required disclaimer.

## Data

The included district GeoJSON and sample research papers are demonstration/sample data unless explicitly identified as another source. They must not be represented as official government statistics.

## Live official data

BhoomiIntel now includes a server-side live connector for the public DILRMP-MIS portal operated by the Department of Land Resources, Ministry of Rural Development. Official indicators such as RoR computerization, cadastral-map digitization, modern record rooms and SRO computerization are fetched at runtime and cached for 10 minutes. The GIS page uses the live DILRMP indicators where a district row is available.

The platform does **not** fabricate missing live values. District geometry and several analytical fields in the hackathon visualization layer remain local/sample data until an authoritative geometry/data API is connected. Policy simulations are forecasts, not live government outcomes.

Official source: https://dilrmp.gov.in/dilrmpold/

## Security

The core application includes:

- password hashing using Node's built-in scrypt
- signed HTTP-only session cookies
- backend role authorization
- restricted CORS configuration
- basic security headers
- AI request rate limiting
- upload limits and filename sanitization
- SQL parameterization
- server-side API secrets
- audit logging without passwords/secrets

## PS 26019 coverage

| Requirement | BhoomiIntel implementation |
|---|---|
| National research/policy repository | Document repository + metadata |
| Natural-language research search | Hybrid retrieval + Claude synthesis |
| Evidence/citations | Retrieved chunk citations |
| GIS land intelligence | Leaflet + district GeoJSON |
| AI policy simulation | Structured intervention projections |
| Research synthesis | Multi-document Research Assistant |
| Role-based access | Researcher / Policymaker / Public |
| Analytics | Research, district and simulation charts |
| AI transparency | AI badges, assumptions, disclaimers |
| Decision support | Evidence → GIS → simulation workflow |

## Phase 2 roadmap

- Official government dataset/API integration
- PostgreSQL and object storage
- Advanced pretrained multilingual embeddings/vector database
- Validated econometric models
- More states/districts and temporal datasets
- Institutional SSO
- Multilingual interfaces
- Additional geospatial layers

## Website mode

BhoomiIntel now includes a public website landing page at `/` and the authenticated platform at `/app`. `/login` provides secure account access. The backend can serve the compiled React site as a single deployable web service after `frontend/dist` is built.

### Single-service website deployment

```bash
npm run install:all
npm run build
npm start
```

Set the backend environment variables before deployment, especially `JWT_SECRET`, `FRONTEND_URL`, and `ANTHROPIC_API_KEY`. The frontend uses `/api` by default when served by the same Express service.

The development seed accounts remain available for local testing only. Replace or disable them before a real deployment.


## v3 Intelligence Center

The SIH Final Edition adds cross-document verification, explainable district risk signals, early-warning alerts, AI metric explanations, and user-owned policy simulation history. See `README_V3_ADDENDUM.md` for details.

### v3.2.2 live DILRMP connector fix
- Uses official server-rendered DILRMP physical-progress reports for CLR, cadastral map digitization, MRR, survey/resurvey, revenue courts, Aadhaar linkage and SRO status.
- Windows `curl.exe` with the system certificate store is attempted first, avoiding the Node TLS leaf-certificate problem seen on some Windows environments.
- MIS 4.0 homepage/dashboard remains a fallback rather than the primary parser because the public page may return a client-rendered shell to direct HTTP clients.
- Live values are accepted only after actual official table parsing. No simulated KPI values are returned.


## DILRMP TLS fallback
The live connector first uses normal certificate-verified HTTPS. The official DILRMP host can intermittently expose a certificate-chain/hostname problem on Windows. For a controlled hackathon demo only, `DILRMP_ALLOW_INSECURE_TLS=true` enables a read-only fallback for the exact DILRMP host. Keep it `false` for production. The response explicitly reports when this fallback is enabled.
