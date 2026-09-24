# CareConnect Backend API

> Production-ready, modular, and AI-enabled home services booking and operations platform backend built with Node.js, Express, MongoDB, and Mongoose.

---

## 🚀 Features

- **Five-Role RBAC**: `admin`, `operations`, `provider`, `customer`, `support`
- **Resource Ownership Enforcements**: Strict multi-tenant security ensuring customers and providers only access permitted resources
- **AI Classification Engine**: Extracts category, required skills, and urgency from free-text problem descriptions with resilient heuristic fallback
- **Explainable Provider Matching**: 5-factor weighted algorithm (Skills 40%, Area 20%, Availability 20%, Rating 10%, Experience 10%)
- **Availability & Conflict Detection**: Overlap prevention on time slots
- **Strict Booking State Machine**: Controlled status progression (`scheduled` → `en_route` → `in_progress` → `completed` → `customer_confirmed`)
- **Automated Invoicing & Payment Tracking**: Auto-generates itemized invoices upon customer confirmation
- **Evidence Management**: Multi-format photo/document upload system for proof of work
- **Reviews & Dynamic Ratings**: Automated provider rating updates based on customer feedback
- **Dispute Resolution Lifecycle**: Support and Operations ticketing workflow
- **Immutable Audit Logging**: Compliance audit trail for all critical administrative, financial, and operational actions
- **Comprehensive Test Suite**: Automated unit and end-to-end workflow tests covering all 30 lifecycle steps

---

## 🛠 Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (`jsonwebtoken`) & bcrypt password hashing (`bcryptjs`)
- **Validation**: `express-validator`
- **Security**: `helmet`, `cors`, `express-rate-limit`
- **File Uploads**: `multer`
- **AI Integration**: Pluggable client (Gemini / OpenAI) with deterministic NLP fallback engine

---

## 📁 Architecture & Directory Structure

```text
server/
├── src/
│   ├── config/             # DB, Environment, and AI configurations
│   ├── models/             # 15 Mongoose data models
│   ├── controllers/        # Modular business logic controllers
│   ├── routes/             # RESTful API route definitions
│   ├── middleware/         # Auth, RBAC, Ownership, Validation, Upload, Error
│   ├── services/           # AI, Availability, Booking, Pricing, Disputes, Audit
│   ├── validators/         # Express-validator schema definitions
│   ├── utils/              # API response formatting, constants, JWT helpers
│   ├── seed/               # Realistic full-platform seed script
│   └── app.js              # Express application assembly
├── tests/                  # Integration and end-to-end test suites
├── uploads/                # Media storage for attachments and evidence
├── server.js               # Application entry point listener
├── .env.example            # Environment configuration template
└── package.json
```

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js >= 18.x
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or MongoDB Atlas URI

### 2. Install Dependencies
```bash
cd server
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in `server/` (copied from `.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/careconnect
JWT_SECRET=careconnect_super_secret_jwt_key_2026_xyz!
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
AI_PROVIDER=gemini
AI_API_KEY=
AI_MODEL=gemini-1.5-flash
UPLOAD_DIR=uploads
```

### 4. Seed Database
Seeds demo accounts, categories, skills, pricing rules, verified providers, and existing sample bookings:
```bash
npm run seed
```

#### Demo Credentials
| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@careconnect.com` | `Password123!` |
| **Operations** | `operations@careconnect.com` | `Password123!` |
| **Support** | `support@careconnect.com` | `Password123!` |
| **Customer** | `customer1@gmail.com` | `Password123!` |
| **Provider** | `provider.plumbing@careconnect.com` | `Password123!` |

### 5. Run Tests
Runs the test suites verifying health, auth, RBAC, state transitions, conflict checks, and the full end-to-end user journey:
```bash
npm test
```

### 6. Start Server
```bash
npm run dev
# Server runs on http://localhost:5000
```

---

## 📡 REST API Reference

### Health Check
- `GET /api/health` — Returns system status and uptime

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register customer or provider account |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |
| `POST` | `/api/auth/logout` | Authenticated | Logout session |
| `POST` | `/api/auth/create-privileged-user` | Admin | Create Admin/Operations/Support user |

### Service Requests (`/api/service-requests`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/service-requests` | Customer | Create service request + AI classification + provider matching |
| `GET` | `/api/service-requests` | Authenticated | List requests (scoped by role / ownership) |
| `GET` | `/api/service-requests/:id` | Authenticated | Retrieve request details |
| `POST` | `/api/service-requests/:id/cancel` | Customer | Cancel open request |

### Providers (`/api/providers`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/providers` | Public | Search/filter providers (category, rating, location) |
| `GET` | `/api/providers/match?requestId=ID` | Authenticated | Calculate explainable AI match scores for a request |
| `GET` | `/api/providers/me` | Provider | Retrieve own provider profile |
| `PATCH` | `/api/providers/me` | Provider | Update skills, categories, pricing, service areas |
| `GET` | `/api/providers/:id` | Public | Retrieve provider public profile |
| `GET` | `/api/providers/pending` | Admin/Operations | View providers awaiting verification |
| `PATCH` | `/api/providers/:id/verify` | Admin | Verify provider profile |
| `PATCH` | `/api/providers/:id/reject` | Admin | Reject provider profile |
| `PATCH` | `/api/providers/:id/suspend` | Admin | Suspend provider account |

### Quotes (`/api/quotes`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/quotes` | Verified Provider | Submit quote on a service request |
| `GET` | `/api/quotes/my` | Provider | View provider's submitted quotes |
| `GET` | `/api/quotes/request/:requestId` | Customer/Admin | View all quotes received for a request |
| `PATCH` | `/api/quotes/:id` | Provider | Update pending quote |
| `POST` | `/api/quotes/:id/accept` | Customer | Accept quote → conflict check → creates Booking |
| `POST` | `/api/quotes/:id/reject` | Customer | Reject quote |

### Bookings (`/api/bookings`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/bookings` | Authenticated | List bookings (scoped by role / ownership) |
| `GET` | `/api/bookings/:id` | Authenticated | Get booking details, evidence, and invoice |
| `PATCH` | `/api/bookings/:id/status` | Provider/Ops | Update job status (`en_route`, `in_progress`, `completed`) |
| `POST` | `/api/bookings/:id/confirm` | Customer | Customer confirms completion → generates Invoice |
| `POST` | `/api/bookings/:id/cancel` | Authenticated | Cancel eligible booking with reason |
| `POST` | `/api/bookings/:id/notes` | Authenticated | Append operational note to booking |

### Job Management & Evidence (`/api/jobs`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/jobs/:bookingId/evidence` | Provider | Upload photo/document evidence (`multipart/form-data`) |
| `GET` | `/api/jobs/:bookingId/evidence` | Authenticated | View uploaded evidence for booking |

### Invoices & Payments (`/api/invoices`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/invoices` | Authenticated | List invoices (scoped by role / ownership) |
| `GET` | `/api/invoices/:id` | Authenticated | Retrieve invoice details |
| `PATCH` | `/api/invoices/:id/payment` | Authenticated | Record payment status (`pending`, `paid`, `failed`, `refunded`) |

### Reviews (`/api/reviews`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/reviews` | Customer | Submit review (1-5 stars) for completed booking |
| `GET` | `/api/reviews/provider/:providerId` | Public | List reviews for a provider |
| `PATCH` | `/api/reviews/:id` | Customer | Update review comment or rating |

### Disputes (`/api/disputes`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/disputes` | Customer | Raise dispute on a booking |
| `GET` | `/api/disputes` | Authenticated | List disputes |
| `GET` | `/api/disputes/:id` | Authenticated | View dispute details |
| `POST` | `/api/disputes/:id/resolve` | Support/Admin | Resolve dispute with resolution summary |
| `POST` | `/api/disputes/:id/escalate` | Support | Escalate dispute to Admin |

### Notifications (`/api/notifications`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Authenticated | Get user notifications & unread count |
| `PATCH` | `/api/notifications/:id/read` | Authenticated | Mark notification as read |
| `PATCH` | `/api/notifications/read-all` | Authenticated | Mark all notifications as read |

### Administration & Operations (`/api/admin`, `/api/operations`, `/api/support`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | Admin | Metrics summary (users, bookings, revenue) |
| `GET` | `/api/admin/analytics` | Admin | Monthly revenue and booking trends |
| `GET` | `/api/admin/audit-logs` | Admin | Immutable compliance audit logs |
| `GET` | `/api/operations/dashboard` | Operations/Admin | Dispatch monitoring dashboard |
| `GET` | `/api/operations/active-jobs` | Operations/Admin | Active en route and in-progress jobs |
| `PATCH` | `/api/operations/bookings/:id/reassign` | Operations/Admin | Reassign booking to another provider |
| `GET` | `/api/support/dashboard` | Support/Admin | Dispute and refund metrics |
| `GET` | `/api/support/refunds` | Support/Admin | Refund tracking |
