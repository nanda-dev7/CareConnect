# 🌟 CareConnect — AI-Enabled Home Services Booking Platform

CareConnect is a production-grade, AI-powered home services marketplace connecting customers with verified local professionals for plumbing, electrical, AC repair, carpentry, appliance service, and cleaning.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Vanilla CSS Design System with dark glassmorphism aesthetic.
- **Backend**: Node.js, Express, MongoDB (Mongoose ODM), JWT Authentication, Helmet, Rate Limiting.
- **AI & Automation**: AI classification engine with domain keyword fallback, 5-factor explainable provider matching algorithm.
- **Testing**: Native Node.js Test Runner (`node:test`, `node:assert/strict`), ESLint.

---

## 🚀 Core Features

1. **Authentication & Role-Based Access Control (RBAC)**:
   - Separate roles: `Customer`, `Provider`, `Admin`, `Operations`, `Support`.
   - JWT-based auth with route-level and ownership-level security.
2. **AI Service Request & Classification**:
   - Natural language description extraction for category, required skills, and urgency.
   - Resilient domain keyword fallback if AI services are unavailable.
3. **5-Factor Provider Matching Engine**:
   - Computes explainable match scores (0–100%) based on Skills (40%), Service Area (20%), Availability (20%), Rating (10%), and Experience (10%).
4. **Interactive Quotes & Booking Lifecycle**:
   - Verified providers submit competitive quotes.
   - Customers compare received quotes and accept their preferred provider.
   - Auto-transitions request to `BOOKED` and creates a scheduled booking.
5. **Server-Side Overlap Conflict Prevention**:
   - Detects and prevents overlapping time slots for providers (`startTime < bEnd && bStart < endTime`).
6. **Strict State Machine**:
   - `SCHEDULED / CONFIRMED → EN_ROUTE → IN_PROGRESS → COMPLETED → CUSTOMER_CONFIRMED`.
   - Rejects illegal transitions with `422 INVALID_TRANSITION`.
7. **Reviews & Rating Recalculation**:
   - Customers submit 1–5 star reviews upon job completion (single review constraint).
   - Automatically recalculates provider average rating and review counts.
8. **Admin Control Center & Dispute Resolution**:
   - Platform KPI metrics (Users, Providers, Bookings, Revenue).
   - Provider verification, category and skill management, booking logs, and customer dispute resolution.

---

## 💻 Installation & Setup

### Prerequisites
- Node.js (v20+ recommended)
- MongoDB running locally or on MongoDB Atlas (`mongodb://localhost:27017/careconnect`)

### 1. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### 2. Environment Variables
Create `.env` in `server/`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/careconnect
JWT_SECRET=careconnect_jwt_secret_key_2026_super_secure
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_URL=http://localhost:5173
```

---

## 🏃 Running the Application

### 1. Seed the Database
Populate test accounts (1 Admin, 5 Customers, Verified & Pending Providers, Categories, Quotes, Bookings):
```bash
npm run seed
# or
cd server && npm run seed
```

### 2. Run Backend Server
```bash
npm run server
# Server starts at http://localhost:5000
```

### 3. Run Frontend
```bash
npm run dev
# Frontend starts at http://localhost:5173
```

---

## 🧪 Testing Commands

```bash
# Run all backend unit & workflow tests (61 tests)
npm test

# Run ESLint check
npm run lint

# Build production bundle
npm run build
```

---

## 🔑 Demo Login Accounts

All seed accounts use password: `Password123!`

| Role | Email | Description |
| :--- | :--- | :--- |
| **Admin** | `admin@careconnect.com` | Full platform management, metrics, provider verification, disputes |
| **Operations** | `operations@careconnect.com` | Live dispatch monitoring and active job queue |
| **Support** | `support@careconnect.com` | Customer complaint ticketing and dispute resolution |
| **Customer 1** | `customer1@gmail.com` | Post AI requests, compare quotes, track bookings, submit reviews |
| **Customer 2** | `customer2@gmail.com` | Secondary customer for multi-user workflows |
| **Provider 1** | `provider.plumbing@careconnect.com` | Verified plumbing specialist with active schedule |
| **Provider 2** | `provider.electrical@careconnect.com` | Verified electrician with active schedule |
| **Provider 3** | `provider.ac@careconnect.com` | Verified AC technician |
| **Provider 4** | `provider.pending@careconnect.com` | Pending provider application awaiting Admin verification |
