# 📈 SaaS Pulse: Real-Time Business Intelligence Engine

A production-grade, full-stack SaaS application that transforms raw API events into real-time business intelligence. Get instant clarity on MRR, churn, usage metrics, and more through a powerful event-driven architecture.

**Built with:** Next.js 14 • Node.js • TypeScript • PostgreSQL • Redis • Stripe

---

## 🎯 Overview

SaaS Pulse is designed for modern founders who need actionable business metrics in real-time. It ingests business events from external applications and provides:

- **Real-Time Metrics Dashboard**: Live MRR, churn, customer activity tracking
- **Private & Community Pulses**: Personalized founder alerts + anonymized social proof
- **Robust Ingestion API**: Zero duplicate revenue with dual-level gatekeeper
- **Production-Ready Architecture**: Built for scale with comprehensive error handling

---

## 🏗️ System Architecture

SaaS Pulse follows a **hardened Event-Driven Architecture (EDA)** optimized for low latency and high reliability:

### **Ingestion Layer**
- Dedicated V1 API endpoint that receives "Pulses" from external apps
- **Dual-Level Gatekeeper** (Redis + PostgreSQL) ensures zero duplicate revenue events
- Graceful caching layer with automatic fallbacks

### **Processing Layer**
- Stateful logic that deduplicates events chronologically
- Real-time calculation of MRR, Churn, and Usage metrics
- Automatic conflict resolution for duplicate plan upgrades (409 handling)

### **Real-Time Layer**
- Socket.io pipeline broadcasting capabilities:
  - **Private Pulses**: Personalized updates for specific founders
  - **Community Pulses**: Anonymized social proof across the platform
- Live founder alerts for high-value events

### **Persistence Layer**
- **PostgreSQL** (via Prisma ORM): Relational data, transactions, and audit logs
- **Redis**: High-speed state tracking, rate limiting, session management, dashboard caching
- Automatic fallbacks if Redis becomes unavailable

---

## 🛠️ Technology Stack

### **Frontend (The Pulse Dashboard)**

| Category | Technology |
|----------|-------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 + Vanilla CSS (Custom Design System) |
| **Animations** | Framer Motion v12 |
| **Icons** | Lucide React |
| **State Management & Data Fetching** | TanStack Query (React Query v5) |
| **Charts & Visualization** | Recharts |
| **HTTP Client** | Axios |
| **Real-Time Communication** | Socket.io-client |
| **Utilities** | clsx, tailwind-merge |

### **Backend (The Pulse Engine)**

| Category | Technology |
|----------|-------------|
| **Runtime** | Node.js + Express v5 |
| **Language** | TypeScript |
| **ORM** | Prisma v7 (PostgreSQL Adapter) |
| **Caching & Rate Limiting** | Redis (ioredis) + Express Rate Limit |
| **Real-Time Server** | Socket.io |
| **Authentication** | JWT (Access & Refresh tokens) + Passport.js (GitHub OAuth) |
| **Password Hashing** | bcryptjs |
| **File Handling** | Multer v2 + Cloudinary Storage |
| **Email Service** | Resend (Transactional emails) |
| **Payment Processing** | Stripe API |
| **Security** | Helmet.js, CORS, Cookie Parser |
| **Validation** | Zod |
| **Development Tools** | Nodemon, tsx, ts-node |

### **Infrastructure & Deployment**

| Service | Purpose |
|---------|---------|
| **Database** | PostgreSQL (PostgreSQL Adapter via Prisma) |
| **Cache Layer** | Redis v5 |
| **Authentication** | GitHub OAuth (Passport.js) |
| **Payment Provider** | Stripe (Subscription lifecycle, webhooks) |
| **File Storage** | Cloudinary |
| **Email Service** | Resend |
| **Frontend Deployment** | Vercel |
| **Backend Deployment** | Railway |

---

## 🚀 Key Features

### **1. Iron-Clad Ingestion API**
External apps can stream events using a simple API Key with:
- ✅ **Tiered Rate Limiting**: Dynamic thresholds (FREE/PRO/ENTERPRISE tiers)
- ✅ **Deduplication Engine**: Automatic 409 Conflict rejection for duplicate plan upgrades
- ✅ **Graceful Degradation**: If Redis fails, system automatically falls back to SQL scans—no 500 errors
- ✅ **Zero Data Loss**: Transactional safety with dual-level gatekeeper

### **2. Live Founder Hub**
- ✅ **Real-Time Feed**: See customer activities the microsecond they happen
- ✅ **Stateful MRR**: Revenue calculated based on latest state of every customer (no hallucinated numbers)
- ✅ **Founder Alerts**: PRO users receive high-value email alerts (via Resend) for major deals & critical events
- ✅ **Community Feed**: Anonymized social proof to build founder momentum

### **3. VIP Onboarding & Waitlist**
- ✅ **Admin Waitlist Management**: Invite founders directly with one-click activation
- ✅ **Auto-PRO Tagging**: Invited beta users automatically get Lifetime PRO plan
- ✅ **Celebratory UI**: "Party Popper" animations on first login

### **4. Advanced Security**
- ✅ **Mobile-Stable Auth**: Secure cross-domain cookie policies (SameSite: None) for mobile browsers
- ✅ **Surgical Account Wipe**: Transactional deletion of user data, subscriptions, and API keys
- ✅ **JWT Token Rotation**: Access & Refresh token strategy with secure storage
- ✅ **Helmet.js Security Headers**: Protection against XSS, clickjacking, and more

### **5. Subscription & Payment Management**
- ✅ **Stripe Integration**: Complete subscription lifecycle management
- ✅ **Webhook Handling**: Real-time payment status updates
- ✅ **Tier-Based Rate Limiting**: Per-tier API quota enforcement
- ✅ **Usage Tracking**: Monitor consumption across FREE/PRO/ENTERPRISE plans

---

## 📦 Installation & Setup

### **Prerequisites**
- **Node.js** v18+ 
- **PostgreSQL** 14+ instance
- **Redis** 6+ instance
- **npm** or **yarn**

### **Step 1: Clone the Repository**
```bash
git clone https://github.com/VISHALLkandharee/Saas-Pulse-.git
cd Saas-Pulse-
```

### **Step 2: Backend Setup**

```bash
cd backend
npm install

# Create and configure .env file
# Required environment variables:
# DATABASE_URL=postgresql://user:password@localhost:5432/saas_pulse
# REDIS_URL=redis://localhost:6379
# JWT_SECRET=your_secret_key
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# GITHUB_CLIENT_ID=your_github_oauth_id
# GITHUB_CLIENT_SECRET=your_github_oauth_secret
# CLOUDINARY_NAME=your_cloudinary_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret
# RESEND_API_KEY=your_resend_key
# NEXT_PUBLIC_API_URL=http://localhost:4000

# Generate Prisma client and setup database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

The backend server runs on `http://localhost:4000`

### **Step 3: Frontend Setup**

```bash
cd client
npm install

# Create and configure .env.local file
# Required environment variables:
# NEXT_PUBLIC_API_URL=http://localhost:4000
# NEXT_PUBLIC_SOCKET_URL=http://localhost:4000

# Run development server
npm run dev
```

The frontend application runs on `http://localhost:3000`

---

## 🚀 Development Commands

### **Backend**
```bash
cd backend
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm start        # Run production build
```

### **Frontend**
```bash
cd client
npm run dev      # Start Next.js dev server
npm run build    # Build for production
npm start        # Run production server
npm run lint     # Run ESLint
```

---

## 🛡️ Stability & Production Hardening

This project has undergone **rigorous Production Audit** with the following safeguards:

✅ **Redis Failover Logic**: Custom middleware checks `redisClient.isReady` before every operation
✅ **100% Operational**: Platform remains fully operational even if Redis temporarily fails
✅ **Automatic Fallback**: Falls back to PostgreSQL for critical operations
✅ **Zero Data Loss**: Transactional guarantees across all layers
✅ **Rate Limiting**: Multi-tier protection against API abuse
✅ **Security Headers**: Helmet.js configured with production-grade settings
✅ **CORS Protection**: Strict origin validation for cross-domain requests
✅ **JWT Validation**: Secure token generation and rotation

---

## 📡 API Documentation

### **Ingestion Endpoint**
```
POST /api/v1/pulse
Headers: { "X-API-Key": "your_api_key" }
Body: {
  "event": "plan_upgrade",
  "customerId": "cust_123",
  "mrr": 99,
  "timestamp": "2026-04-28T10:30:00Z"
}
```

**Response**: 
- `201 Created`: Event processed successfully
- `409 Conflict`: Duplicate event detected
- `429 Too Many Requests`: Rate limit exceeded
- `401 Unauthorized`: Invalid API key

### **Authentication**
- GitHub OAuth at `/auth/github`
- JWT tokens returned with refresh token mechanism
- Secure HTTP-only cookies with SameSite protection

---

## 📊 Project Structure

```
Saas-Pulse-/
├── backend/                    # Node.js + Express backend
│   ├── src/
│   │   ├── server.ts          # Main server entry point
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Custom middleware (Redis failover, auth, rate limiting)
│   │   ├── controllers/       # Business logic
│   │   ├── services/          # Core services (events, metrics, notifications)
│   │   └── utils/             # Utilities & helpers
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── package.json
│   └── tsconfig.json
│
├── client/                     # Next.js 14 frontend
│   ├── app/                   # App router structure
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── dashboard/         # Dashboard routes
│   ├── components/            # React components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities & API clients
│   ├── styles/                # Global styles
│   ├── package.json
│   └── tsconfig.json
│
└── README.md                  # This file
```

---

## 🔌 Environment Variables

### **Backend (.env)**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/saas_pulse

# Cache
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_super_secret_jwt_key
GITHUB_CLIENT_ID=your_github_oauth_id
GITHUB_CLIENT_SECRET=your_github_oauth_secret

# Payment
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=your_resend_key

# File Storage
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### **Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

---

## 🧪 Testing & Quality

- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Code quality checks integrated
- **Zod**: Schema validation for API inputs
- **Helmet.js**: Security headers validation

---

## 🎨 Design System

The frontend uses a **custom design system** combining:
- Tailwind CSS v4 utility classes
- Vanilla CSS custom properties for theme management
- Framer Motion for smooth, production-grade animations
- Lucide React icons for consistent iconography
- Recharts for data visualization

---

## 📈 Deployment

### **Frontend (Vercel)**
```bash
# Push to main branch and Vercel auto-deploys
git push origin main
```

### **Backend (Railway)**
```bash
# Connect Railway to your Git repository
# Set environment variables in Railway dashboard
# Deploy with: git push origin main
```

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙌 Acknowledgments

- Built with ❤️ for Founders everywhere
- Inspired by the need for real-time business intelligence
- Powered by amazing open-source communities

---

## 📞 Support & Contact

For questions, issues, or suggestions:
- Open an issue on [GitHub](https://github.com/VISHALLkandharee/Saas-Pulse-/issues)
- Check existing documentation and guides
- Review the API endpoint specifications

---

**Last Updated**: April 28, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅