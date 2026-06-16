# SaaS Pulse — Real‑Time Business Intelligence Engine

Live demo: https://saas-pulse-liart.vercel.app/
Contact: vishall.kandharee@gmail.com

One-line summary
A production-ready event-driven app that ingests business events and provides real-time MRR, churn, usage signals, and founder alerts through a dashboard and ingestion API.

Quick highlights
- Stateful ingestion API with deduplication and conflict handling
- Real-time dashboard and founder/community feeds (Socket.io)
- Stripe subscription lifecycle + webhook handling
- Built with Next.js (client) and Node.js + TypeScript (backend)

Screenshots / Quick demo

![Screenshot 1 — connection failure view](assets/Screenshot%20(253).png)

![Screenshot 2 — connection failure (alternate)](assets/Screenshot%20(254).png)

![Screenshot 3 — successful Supabase connection](assets/Screenshot%20(255).png)

![Screenshot 4 — developer view / package.json](assets/Screenshot%20(256).png)

(Images are stored in /assets/; filenames currently contain spaces which GitHub renders, but I recommend renaming them to URL-friendly names.)

Quick start (fastest path)
1. Clone:
   git clone https://github.com/VISHALLkandharee/Saas-Pulse-.git && cd Saas-Pulse-
2. Backend (dev):
   cd backend
   npm install
   # create and populate .env (see below)
   npx prisma generate
   npx prisma db push
   npm run dev
3. Frontend (dev):
   cd client
   npm install
   cp .env.local.example .env.local   # or create .env.local with the NEXT_PUBLIC_API_URL and NEXT_PUBLIC_SOCKET_URL
   npm run dev
4. Open http://localhost:3000 (or view the live demo at the link above)

What’s in this repo
- backend/: Node.js + Express + TypeScript — ingestion API, processing engine, Socket.io server, Stripe webhooks, Prisma schema
- client/: Next.js 14 (App Router) — dashboard UI, charts, and real-time feed
- prisma/: DB schema and migrations
- scripts, configs, and docs

Technology (high level)
- Frontend: Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Recharts, TanStack Query
- Backend: Node.js, Express v5, TypeScript, Prisma (Postgres), Redis (for state/caching), Socket.io
- Integrations: Stripe (payments), Cloudinary (files), Resend (emails), GitHub OAuth

Implemented features (what’s actually in the code)
- Ingestion endpoint: POST /api/v1/pulse with X-API-Key header
- Deduplication and 409 handling for duplicate events
- Real-time Socket.io pipeline for private and community pulses
- Stripe integration for subscription lifecycle and webhooks
- Admin waitlist/invite flow and PRO onboarding
- Basic security middleware (Helmet, CORS rules) and JWT-based auth

Example ingestion request
POST /api/v1/pulse
Headers: { "X-API-Key": "your_api_key" }
Body:
{
  "event": "plan_upgrade",
  "customerId": "cust_123",
  "mrr": 99,
  "timestamp": "2026-04-28T10:30:00Z"
}
Responses: 201 Created | 409 Conflict | 429 Too Many Requests | 401 Unauthorized

Project layout
Saas-Pulse-/
├── backend/                    # Node.js + Express backend (API, processing)
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── tsconfig.json
├── client/                     # Next.js 14 frontend (dashboard)
│   ├── app/
│   ├── components/
│   ├── package.json
│   └── tsconfig.json
└── README.md

Environment variables (examples)
# Backend (.env)
DATABASE_URL=postgresql://user:password@host:5432/saas_pulse
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=...
CLOUDINARY_NAME=...
NEXT_PUBLIC_API_URL=http://localhost:4000

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000

Notes about stability and claims
- The code contains logic for Redis failover and SQL fallbacks in some areas; please run local tests and a demo dataset to verify behavior for your environment.
- Avoid absolute claims (e.g., “100% operational”) in public-facing text unless you have monitoring/metrics to back them; the README focuses on implemented features and the live demo instead.

Testing & quality
- TypeScript (strict mode enabled)
- Zod used for runtime validation in API routes
- ESLint configured (run lint commands in client and backend)

Developer assets to add (recommended)
- Add the 4 screenshots to /assets/ using the filenames referenced above.
- Add a short 30–60s Loom demo and link it near the top (it helps recruiters evaluate quickly).
- Add a short architecture diagram (assets/arch.png) showing ingestion → processing → persistence → broadcast → dashboard.

Contributing
1. Fork the repository
2. Create branch: git checkout -b feature/your-feature
3. Run tests and linters
4. Open a PR describing the change

Contact & support
- Live demo: https://saas-pulse-liart.vercel.app/
- Email: vishall.kandharee@gmail.com
- Issues: https://github.com/VISHALLkandharee/Saas-Pulse-/issues

Last updated: 2026-06-16
