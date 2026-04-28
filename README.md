📈 SaaS Pulse: Real-Time Business Intelligence Engine
SaaS Pulse is a production-grade, state-aware metrics engine designed for modern founders. It transforms raw API events into real-time business intelligence, providing instant clarity on MRR, churn, and customer activity through a beautiful, high-performance dashboard.


🏗️ System Architecture
SaaS Pulse follows a hardened Event-Driven Architecture (EDA) built for low latency and high reliability.

Ingestion Layer: A dedicated V1 API endpoint that receives "Pulses" from external apps. It uses a Dual-Level Gatekeeper (Redis + PostgreSQL) to ensure zero duplicate revenue events even during cache outages.
Processing Layer: Stateful logic that deduplicates events chronologically and calculates MRR, Churn, and Usage metrics on-the-fly.
Real-Time Layer: A Socket.io pipeline that broadcasts "Private Pulses" to specific founders and "Community Pulses" (anonymized social proof) to the entire platform.
Persistence Layer: PostgreSQL (via Prisma) for relational data and Redis for high-speed state tracking, rate limiting, and dashboard caching.
🛠️ The Tech Stack
Frontend (The Pulse Dashboard)
Framework: Next.js 14 (App Router)
Styling: Tailwind CSS + Vanilla CSS (Custom Design System)
Animations: Framer Motion (Premium transitions and micro-interactions)
Icons: Lucide React
Data Fetching: TanStack Query (React Query)
Real-Time: Socket.io-client
Backend (The Pulse Engine)
Runtime: Node.js + Express + TypeScript
ORM: Prisma
Caching/Rate Limiting: Redis (with isReady fail-safe fallbacks)
Real-Time Server: Socket.io
File Handling: Multer (with support for local and Cloudinary storage)
Authentication: JWT (Access & Refresh tokens) + Passport.js (GitHub OAuth)
Communication: Resend (Transactional emails)
Infrastructure
Database: PostgreSQL
Payment Processing: Stripe (Subscription lifecycle & Webhooks)
Deployment: Vercel (Frontend) & Railway (Backend)
🚀 Key Features
1. Iron-Clad Ingestion API
External apps can stream events using a simple API Key. The engine handles:

Tiered Rate Limiting: Dynamic thresholds (FREE/PRO/ENTERPRISE).
Deduplication: Automatic 409 Conflict rejection for duplicate plan upgrades.
Graceful Degradation: If Redis fails, the system automatically falls back to SQL scans to prevent 500 errors.
2. Live Founder Hub
Real-Time Feed: See customer activities the microsecond they happen.
Stateful MRR: Revenue is calculated based on the latest state of every customer, preventing "hallucination" in your financial data.
Founder Alerts: PRO users receive high-value email alerts (via Resend) when a major deal is closed or a critical event occurs.
3. VIP Onboarding & Waitlist
Waitlist Management: Integrated admin panel to invite founders.
Auto-Pro Tagging: Invited beta users are automatically granted a Lifetime PRO plan and greeted with a celebratory "Party Popper" UI.
4. Advanced Security
Mobile-Stable Auth: Secure cross-domain cookie policies (SameSite: None) for seamless login on mobile browsers.
Surgical Account Wipe: Transactional deletion of all user data, subscriptions, and API keys to ensure privacy compliance.
📦 Installation & Setup
Prerequisites
Node.js (v18+)
PostgreSQL Instance
Redis Instance
1. Clone the repository
bash
git clone https://github.com/your-username/saas-pulse.git
cd saas-pulse
2. Backend Setup
bash
cd backend
npm install
# Configure your .env (DATABASE_URL, REDIS_URL, STRIPE_SECRET, etc.)
npx prisma generate
npx prisma db push
npm run dev
3. Frontend Setup
bash
cd client
npm install
# Configure your .env (NEXT_PUBLIC_API_URL, etc.)
npm run dev
🛡️ Stability & Hardening Note
This project has undergone a rigorous Production Audit. We implemented custom middleware to check redisClient.isReady before every operation, ensuring the platform remains 100% operational even if the caching layer fluctuates. SaaS Pulse is built for the real world.

📄 License
This project is licensed under the MIT License - see the 

LICENSE
 file for details.

Built with ❤️ for Founders everywhere.
