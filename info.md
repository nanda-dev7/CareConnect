# CareConnect Backend Development Prompt

## 1. Project

Build the **complete backend** for **CareConnect**, an AI-enabled home services booking and operations platform.

The backend must be built primarily using:

* **Node.js**
* **Express.js**
* **MongoDB**
* **Mongoose**
* **JWT**
* **bcrypt**
* **REST APIs**
* **AI API integration**

Do **not** build the frontend yet.

The frontend will be developed separately later using React.

The backend must be production-structured, modular, secure, scalable, and easy to connect to a React frontend.

---

# 2. Core Project Concept

CareConnect connects customers with home-service providers.

Supported services include:

* Plumbing
* Electrical
* AC Repair
* Appliance Repair
* Cleaning
* Carpentry
* Painting
* Pest Control
* Gardening
* General Maintenance

The main workflow is:

```text
Customer
    ↓
Create Service Request
    ↓
AI Classification
    ↓
Category + Required Skills + Urgency
    ↓
Provider Matching
    ↓
Suitable Providers
    ↓
Providers Submit Quotes
    ↓
Customer Selects Provider
    ↓
Availability Check
    ↓
Booking Created
    ↓
Provider Performs Job
    ↓
Job Evidence
    ↓
Job Completed
    ↓
Customer Confirms Completion
    ↓
Invoice
    ↓
Payment Status
    ↓
Review
```

The backend must support this complete workflow through REST APIs.

---

# 3. User Roles

Implement exactly these five roles:

```text
admin
operations
provider
customer
support
```

## Admin

Can:

* Manage users
* Manage providers
* Verify providers
* Manage service categories
* Manage skills
* Manage pricing rules
* Manage disputes
* View analytics
* View audit logs
* Manage platform settings

## Operations Manager

Can:

* Monitor bookings
* Monitor active jobs
* Assign providers
* Reassign providers
* Handle escalations
* Monitor service quality
* Monitor delayed jobs
* Track provider performance

## Service Provider

Can:

* Create provider profile
* Add skills
* Add service categories
* Add service areas
* Add experience
* Set pricing
* Upload verification documents
* Manage availability
* View suitable service requests
* Submit quotes
* Manage assigned jobs
* Update job status
* Add job notes
* Upload evidence
* Mark jobs completed
* View invoices
* View ratings
* Track earnings

## Customer

Can:

* Register/login
* Manage profile
* Create service requests
* Describe service problems
* Upload attachments
* View AI classification
* View recommended providers
* View provider quotes
* Compare quotes
* Select provider
* Book provider
* Track booking
* View job evidence
* Confirm job completion
* View invoices
* View booking history
* Cancel eligible bookings
* Raise disputes
* Submit ratings/reviews

## Support Agent

Can:

* View complaints
* Manage disputes
* Handle cancellations
* Handle refund requests
* Communicate with customers
* Communicate with providers
* Resolve service issues
* Escalate issues to Admin

---

# 4. Technology Requirements

Use:

```text
Node.js
Express.js
MongoDB
Mongoose
JWT
bcrypt
dotenv
cors
helmet
express-rate-limit
express-validator or Joi/Zod
multer
```

For AI:

```text
AI API / LLM API
```

Use an abstraction layer so the AI provider can be changed later.

For example:

```text
services/
    ai/
        aiService.js
        classificationService.js
        matchingService.js
```

Do not hard-code AI logic directly inside controllers.

---

# 5. Recommended Backend Architecture

Use a clean modular architecture.

```text
server/
│
├── src/
│   │
│   ├── config/
│   │   ├── db.js
│   │   ├── env.js
│   │   └── ai.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Provider.js
│   │   ├── Category.js
│   │   ├── Skill.js
│   │   ├── Availability.js
│   │   ├── ServiceRequest.js
│   │   ├── Quote.js
│   │   ├── Booking.js
│   │   ├── JobEvidence.js
│   │   ├── Invoice.js
│   │   ├── Review.js
│   │   ├── Dispute.js
│   │   ├── Notification.js
│   │   ├── AuditLog.js
│   │   └── PricingRule.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── providerController.js
│   │   ├── categoryController.js
│   │   ├── serviceRequestController.js
│   │   ├── quoteController.js
│   │   ├── availabilityController.js
│   │   ├── bookingController.js
│   │   ├── jobController.js
│   │   ├── invoiceController.js
│   │   ├── reviewController.js
│   │   ├── disputeController.js
│   │   ├── notificationController.js
│   │   └── adminController.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── providerRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── serviceRequestRoutes.js
│   │   ├── quoteRoutes.js
│   │   ├── availabilityRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── jobRoutes.js
│   │   ├── invoiceRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── disputeRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── adminRoutes.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── ownershipMiddleware.js
│   │   ├── validationMiddleware.js
│   │   ├── uploadMiddleware.js
│   │   └── errorMiddleware.js
│   │
│   ├── services/
│   │   ├── ai/
│   │   │   ├── aiService.js
│   │   │   ├── classificationService.js
│   │   │   └── matchingService.js
│   │   │
│   │   ├── availabilityService.js
│   │   ├── bookingService.js
│   │   ├── pricingService.js
│   │   ├── notificationService.js
│   │   └── disputeService.js
│   │
│   ├── validators/
│   │   ├── authValidators.js
│   │   ├── providerValidators.js
│   │   ├── requestValidators.js
│   │   ├── quoteValidators.js
│   │   ├── bookingValidators.js
│   │   └── reviewValidators.js
│   │
│   ├── utils/
│   │   ├── generateToken.js
│   │   ├── apiResponse.js
│   │   └── constants.js
│   │
│   ├── seed/
│   │   └── seedDatabase.js
│   │
│   └── app.js
│
├── server.js
├── .env
├── .env.example
├── package.json
└── README.md
```

---

# 6. Database Design

Use MongoDB with Mongoose.

Create these collections/models:

```text
users
providers
categories
skills
availability
serviceRequests
quotes
bookings
jobEvidence
invoices
reviews
disputes
notifications
auditLogs
pricingRules
```

---

# 7. User Model

Create a `User` model.

Required fields:

```text
name
email
password
phone
role
address
isActive
createdAt
updatedAt
```

Role enum:

```text
admin
operations
provider
customer
support
```

Requirements:

* Email must be unique.
* Password must never be returned in API responses.
* Password must be hashed using bcrypt.
* Add timestamps.
* Validate email.
* Validate role.

---

# 8. Authentication

Implement:

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

## Registration

Customer registration should create:

```text
role = customer
```

Provider registration should create a provider user account and provider profile.

Admin/Operations/Support accounts should not be publicly created.

They should be seeded or created by an authorized Admin.

## Login

Login should:

1. Find user by email.
2. Verify password.
3. Check account status.
4. Generate JWT.
5. Return safe user information and token.

JWT payload should contain:

```json
{
  "userId": "...",
  "role": "customer"
}
```

---

# 9. Authentication Middleware

Create:

```text
authMiddleware.js
```

It should:

1. Read JWT from Authorization header.
2. Validate token.
3. Load user.
4. Attach user to `req.user`.
5. Reject invalid/expired tokens.

Expected header:

```http
Authorization: Bearer <token>
```

---

# 10. Role-Based Authorization

Create reusable middleware:

```text
authorizeRoles("admin")
authorizeRoles("admin", "operations")
authorizeRoles("customer")
```

Example:

```javascript
router.post(
  "/categories",
  authMiddleware,
  authorizeRoles("admin"),
  createCategory
);
```

Never rely only on frontend role checks.

All authorization must be enforced on the backend.

---

# 11. Resource Ownership

Implement ownership validation.

Examples:

A customer can only:

* View their own requests.
* View their own bookings.
* Cancel their own eligible bookings.
* View their own invoices.
* Create reviews for their own completed bookings.

A provider can only:

* Modify their own profile.
* Manage their own availability.
* Submit quotes as themselves.
* Manage their assigned jobs.
* Upload evidence for their assigned jobs.

A user must never access another user's private resource simply by changing an ID in the URL.

---

# 12. Provider Model

Create a `Provider` model.

Fields:

```text
userId
skills
categories
serviceAreas
experience
pricing
documents
verificationStatus
rating
totalReviews
completedJobs
isAvailable
createdAt
updatedAt
```

Verification statuses:

```text
pending
verified
rejected
suspended
```

Only `verified` providers should normally be eligible for provider matching.

---

# 13. Provider APIs

Implement:

```http
POST   /api/providers
GET    /api/providers
GET    /api/providers/:id
PATCH  /api/providers/:id
GET    /api/providers/me
PATCH  /api/providers/me
```

Admin:

```http
GET   /api/providers/pending
PATCH /api/providers/:id/verify
PATCH /api/providers/:id/reject
PATCH /api/providers/:id/suspend
```

---

# 14. Category Model

Create:

```text
Category
```

Fields:

```text
name
description
requiredSkills
basePrice
isActive
createdAt
updatedAt
```

Example:

```json
{
  "name": "Plumbing",
  "requiredSkills": [
    "Pipe Repair",
    "Leak Detection",
    "Sink Repair"
  ],
  "basePrice": 300
}
```

Admin APIs:

```http
GET    /api/categories
POST   /api/categories
GET    /api/categories/:id
PATCH  /api/categories/:id
DELETE /api/categories/:id
```

Only Admin can create/update/delete categories.

---

# 15. Skill Model

Create a `Skill` model.

Fields:

```text
name
description
categoryId
isActive
```

Examples:

```text
Pipe Repair
Leak Detection
AC Diagnostics
Cooling System Repair
Electrical Wiring
Deep Cleaning
Carpentry
```

---

# 16. Service Request Model

Create:

```text
ServiceRequest
```

Fields:

```text
customerId
description
categoryId
requiredSkills
location
preferredDate
preferredTime
urgency
attachments
aiClassification
status
createdAt
updatedAt
```

Status:

```text
open
matching
quoted
provider_selected
booked
cancelled
completed
disputed
```

Example:

```json
{
  "customerId": "...",
  "description": "My kitchen sink is leaking",
  "categoryId": "...",
  "requiredSkills": [
    "Leak Detection",
    "Sink Repair"
  ],
  "urgency": "medium",
  "status": "open"
}
```

---

# 17. Create Service Request API

Implement:

```http
POST /api/service-requests
```

Flow:

```text
Customer submits request
        ↓
Validate request
        ↓
Create ServiceRequest
        ↓
Send description to AI
        ↓
AI classifies request
        ↓
Save category
        ↓
Save required skills
        ↓
Save urgency
        ↓
Find suitable providers
        ↓
Return request + recommendations
```

Do not make the AI call directly from the React frontend.

The backend must control the AI integration.

---

# 18. AI SERVICE CLASSIFICATION

Create:

```text
services/ai/classificationService.js
```

Input:

```text
Customer's free-text description
```

Example:

```text
"My AC is running but the room is not getting cold."
```

Expected structured output:

```json
{
  "category": "AC Repair",
  "skills": [
    "AC Diagnostics",
    "Cooling System Repair"
  ],
  "urgency": "medium"
}
```

The AI output must be validated before saving it.

Do not blindly trust arbitrary AI output.

Use a strict JSON schema / structured output if supported by the chosen AI API.

---

# 19. AI Error Handling

If AI fails:

```text
AI API unavailable
AI timeout
Invalid AI response
API rate limit
```

The service request should NOT necessarily fail.

Implement fallback behavior.

Example:

```text
AI fails
   ↓
Use customer-selected category if available
   ↓
Otherwise mark classification as:
"pending"
```

Store an AI status such as:

```text
pending
completed
failed
```

---

# 20. AI Provider Matching

Create:

```text
services/ai/matchingService.js
```

The matching system should use:

```text
Required Skills
Provider Skills
Category
Service Area
Availability
Rating
Experience
Historical Performance
Verification Status
```

Important:

First perform deterministic filtering.

```text
Only verified providers
        ↓
Matching category
        ↓
Matching skills
        ↓
Matching service area
        ↓
Available for requested slot
```

Then rank the remaining providers.

Do not use AI as a replacement for basic database filtering.

---

# 21. Provider Matching API

Implement:

```http
GET /api/providers/match?requestId=<id>
```

The backend should:

1. Load service request.
2. Verify requester permission.
3. Read category.
4. Read required skills.
5. Find verified providers.
6. Filter by service area.
7. Check availability.
8. Calculate match factors.
9. Rank providers.
10. Return recommendations.

Example response:

```json
{
  "requestId": "...",
  "providers": [
    {
      "providerId": "...",
      "name": "Ravi Services",
      "rating": 4.8,
      "experience": 7,
      "matchScore": 94,
      "matchedSkills": [
        "AC Diagnostics",
        "Cooling System Repair"
      ],
      "available": true
    }
  ]
}
```

---

# 22. Matching Score

Create an explainable matching system.

Possible factors:

```text
Skill Match
Service Area Match
Availability Match
Rating
Experience
Historical Performance
```

Example:

```text
Skill Match       → 40%
Area Match        → 20%
Availability      → 20%
Rating            → 10%
Experience        → 10%
```

Keep the weights configurable.

Do not make the matching system an unexplained black box.

---

# 23. Availability Model

Create:

```text
Availability
```

Fields:

```text
providerId
dayOfWeek
startTime
endTime
isAvailable
```

Providers should be able to define recurring availability.

Example:

```text
Monday
09:00 - 13:00

Monday
16:00 - 20:00
```

---

# 24. Availability APIs

Implement:

```http
GET    /api/availability
POST   /api/availability
PATCH  /api/availability/:id
DELETE /api/availability/:id
```

Provider can only manage their own availability.

---

# 25. Availability Conflict Detection

Before creating a booking:

1. Load provider availability.
2. Check requested date.
3. Check requested time.
4. Query existing bookings.
5. Detect overlapping bookings.
6. Reject if overlap exists.

Example:

```text
Existing:
10:00 - 11:00

Requested:
10:30 - 11:30

Result:
CONFLICT
```

Return:

```http
409 Conflict
```

with a clear message.

---

# 26. Quote Model

Create:

```text
Quote
```

Fields:

```text
requestId
providerId
price
estimatedDuration
availableDate
availableTime
message
status
createdAt
updatedAt
```

Status:

```text
pending
accepted
rejected
expired
withdrawn
```

---

# 27. Quote APIs

Provider:

```http
POST /api/quotes
GET  /api/quotes/my
PATCH /api/quotes/:id
```

Customer:

```http
GET /api/quotes/request/:requestId
POST /api/quotes/:id/accept
POST /api/quotes/:id/reject
```

Only suitable providers should be able to quote on a request.

---

# 28. Quote Rules

A provider:

* Cannot quote as another provider.
* Cannot quote if suspended.
* Cannot quote if not verified.
* Cannot quote after request expiration.
* Cannot create duplicate active quotes for the same request.

A customer:

* Can only view quotes for their own request.
* Can accept only one quote.
* Accepting a quote should trigger booking creation.

---

# 29. Booking Model

Create:

```text
Booking
```

Fields:

```text
requestId
customerId
providerId
quoteId
date
startTime
endTime
location
price
status
notes
createdAt
updatedAt
```

Status:

```text
requested
quoted
provider_selected
scheduled
assigned
en_route
in_progress
completed
customer_confirmed
cancelled
disputed
```

---

# 30. Booking Creation

When customer accepts a quote:

```text
Quote accepted
       ↓
Check request ownership
       ↓
Check quote validity
       ↓
Check provider verification
       ↓
Check provider availability
       ↓
Check booking conflicts
       ↓
Create booking
       ↓
Update quote
       ↓
Update service request
       ↓
Create notifications
       ↓
Create audit log
```

Use a MongoDB transaction where appropriate so related updates do not leave the database in an inconsistent state.

---

# 31. Booking APIs

Implement:

```http
POST  /api/bookings
GET   /api/bookings
GET   /api/bookings/:id
PATCH /api/bookings/:id/status
POST  /api/bookings/:id/cancel
```

Role-specific access must be enforced.

---

# 32. Job Management

Create job functionality around the booking.

Provider should be able to:

```text
Start Job
Add Notes
Upload Evidence
Update Status
Complete Job
```

Status flow:

```text
SCHEDULED
    ↓
EN_ROUTE
    ↓
IN_PROGRESS
    ↓
COMPLETED
```

Only the assigned provider can start/manage their job.

---

# 33. Job Evidence

Create:

```text
JobEvidence
```

Fields:

```text
bookingId
providerId
type
fileUrl
description
uploadedAt
```

Evidence types:

```text
before
during
after
document
other
```

Implement file upload support using an abstraction so storage can later be Cloudinary, S3, or another object-storage provider.

Do not store large binary files directly inside MongoDB unless there is a specific reason to do so.

---

# 34. Job Completion

Provider:

```http
PATCH /api/bookings/:id/status
```

When status becomes:

```text
completed
```

the backend should:

1. Verify provider ownership.
2. Verify required job information.
3. Update booking.
4. Notify customer.
5. Allow customer confirmation.

---

# 35. Customer Confirmation

Implement:

```http
POST /api/bookings/:id/confirm
```

Only the customer belonging to the booking can confirm it.

Flow:

```text
Provider completes job
        ↓
Customer reviews evidence
        ↓
Customer confirms
        ↓
Booking = customer_confirmed
        ↓
Generate invoice
        ↓
Notify customer/provider
```

---

# 36. Invoice Model

Create:

```text
Invoice
```

Fields:

```text
bookingId
customerId
providerId
basePrice
partsCost
serviceFee
additionalCharges
total
paymentStatus
issuedAt
```

Payment status:

```text
pending
paid
failed
refunded
partially_refunded
```

---

# 37. Invoice APIs

Implement:

```http
GET /api/invoices
GET /api/invoices/:id
```

Only authorized users should access an invoice.

---

# 38. Payment

For the first backend version, payment can be represented using a payment status.

Do not unnecessarily integrate a real payment gateway unless required.

Support:

```text
pending
paid
failed
refunded
```

Keep payment logic isolated so a real gateway such as Razorpay/Stripe can be added later.

---

# 39. Review Model

Create:

```text
Review
```

Fields:

```text
bookingId
customerId
providerId
rating
comment
createdAt
updatedAt
```

Rating:

```text
1 - 5
```

---

# 40. Review Rules

A customer can review only:

* Their own booking.
* A completed/customer-confirmed booking.
* The provider assigned to that booking.

Prevent duplicate reviews for the same booking.

After a review:

```text
Provider rating
        ↓
Recalculate average
        ↓
Update Provider.rating
```

---

# 41. Review APIs

```http
POST /api/reviews
GET  /api/reviews/provider/:providerId
PATCH /api/reviews/:id
```

---

# 42. Dispute Model

Create:

```text
Dispute
```

Fields:

```text
bookingId
customerId
providerId
reason
description
evidence
status
resolution
resolvedBy
resolvedAt
createdAt
updatedAt
```

Status:

```text
open
under_review
waiting_customer
waiting_provider
resolved
rejected
escalated
```

---

# 43. Dispute APIs

```http
POST  /api/disputes
GET   /api/disputes
GET   /api/disputes/:id
PATCH /api/disputes/:id
POST  /api/disputes/:id/resolve
POST  /api/disputes/:id/escalate
```

Customer can create disputes.

Support can investigate and resolve.

Admin can oversee/escalate disputes.

---

# 44. Cancellation

Implement cancellation rules.

Example:

```http
POST /api/bookings/:id/cancel
```

The backend should check:

* Who is cancelling?
* Booking status.
* Cancellation eligibility.
* Time until scheduled service.
* Applicable policy.

Do not allow cancellation after the job is completed.

Store:

```text
cancelledBy
cancellationReason
cancelledAt
```

---

# 45. Pricing Rules

Create:

```text
PricingRule
```

Fields:

```text
categoryId
basePrice
emergencyFee
weekendFee
serviceFee
isActive
```

Create:

```http
GET    /api/pricing-rules
POST   /api/pricing-rules
PATCH  /api/pricing-rules/:id
DELETE /api/pricing-rules/:id
```

Only Admin can modify pricing rules.

---

# 46. Pricing Service

Create:

```text
pricingService.js
```

It should calculate:

```text
Base Price
+
Parts Cost
+
Service Fee
+
Emergency Fee
+
Additional Charges
=
Total
```

Keep pricing logic outside controllers.

---

# 47. Notifications

Create:

```text
Notification
```

Fields:

```text
userId
title
message
type
relatedEntity
isRead
createdAt
```

Types:

```text
request
quote
booking
job
invoice
dispute
system
```

---

# 48. Notification Events

Generate notifications for events such as:

### Customer

```text
Service request created
Quote received
Booking confirmed
Provider assigned
Provider arriving
Job completed
Invoice generated
Dispute updated
```

### Provider

```text
New service request
Quote accepted
Booking confirmed
Booking cancelled
Customer raised dispute
```

### Operations

```text
New escalation
Delayed job
Provider issue
High priority request
```

### Support

```text
New complaint
New dispute
Refund request
Escalated issue
```

---

# 49. Notification APIs

```http
GET   /api/notifications
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
```

---

# 50. Audit Logs

Create:

```text
AuditLog
```

Fields:

```text
userId
action
entityType
entityId
metadata
ipAddress
timestamp
```

Record important actions:

```text
Provider verified
Provider suspended
Category created
Pricing changed
Booking reassigned
Dispute resolved
Refund processed
User blocked
```

Audit logs should be immutable to normal users.

---

# 51. Admin APIs

Implement:

```http
GET /api/admin/dashboard
GET /api/admin/users
GET /api/admin/providers
GET /api/admin/bookings
GET /api/admin/disputes
GET /api/admin/analytics
GET /api/admin/audit-logs
```

Admin actions:

```http
PATCH /api/admin/users/:id/status
PATCH /api/admin/providers/:id/verify
PATCH /api/admin/providers/:id/suspend
```

---

# 52. Operations APIs

Implement:

```http
GET /api/operations/dashboard
GET /api/operations/bookings
GET /api/operations/active-jobs
GET /api/operations/escalations
PATCH /api/operations/bookings/:id/assign
PATCH /api/operations/bookings/:id/reassign
```

Operations Manager should not automatically have Admin privileges.

---

# 53. Support APIs

Implement:

```http
GET /api/support/dashboard
GET /api/support/disputes
GET /api/support/complaints
GET /api/support/refunds
PATCH /api/support/disputes/:id
POST /api/support/disputes/:id/resolve
```

---

# 54. Search and Filtering

Backend APIs should support query parameters.

Example:

```http
GET /api/providers?category=plumbing&rating=4&location=Hyderabad
```

Bookings:

```http
GET /api/bookings?status=in_progress&date=2026-09-24
```

Providers:

```http
GET /api/providers?verificationStatus=verified&category=plumbing
```

Use pagination.

Example:

```text
?page=1&limit=20
```

Return pagination metadata:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

# 55. API Response Format

Use a consistent response structure.

Success:

```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Provider is not available for this time slot",
  "error": "BOOKING_CONFLICT"
}
```

---

# 56. HTTP Status Codes

Use proper HTTP status codes.

```text
200 → Successful GET/PATCH
201 → Created
400 → Validation error
401 → Unauthenticated
403 → Unauthorized
404 → Not found
409 → Conflict
422 → Invalid business input
429 → Rate limited
500 → Internal server error
```

---

# 57. Global Error Handling

Create:

```text
errorMiddleware.js
```

Controllers should not contain repetitive error-response logic.

Use centralized error handling.

Handle:

```text
ValidationError
CastError
Duplicate key errors
JWT errors
AI API errors
MongoDB errors
Business logic errors
Unknown errors
```

Never expose stack traces or sensitive information in production responses.

---

# 58. Validation

Every API accepting user input must validate it.

Validate:

* Email
* Password
* Phone
* IDs
* Prices
* Dates
* Times
* Ratings
* Roles
* Status values
* Descriptions
* Required fields

Never trust frontend validation.

---

# 59. Security

Implement:

```text
JWT authentication
bcrypt password hashing
RBAC
Resource ownership
Helmet
CORS
Rate limiting
Input validation
Environment variables
Secure error handling
MongoDB security
```

Never commit:

```text
.env
JWT secrets
AI API keys
MongoDB credentials
```

Create:

```text
.env.example
```

---

# 60. Environment Variables

Create:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=

JWT_SECRET=
JWT_EXPIRES_IN=7d

AI_API_KEY=
AI_MODEL=

CLIENT_URL=http://localhost:5173
```

Do not hard-code credentials anywhere in the source code.

---

# 61. Seed Data

Create:

```text
src/seed/seedDatabase.js
```

Seed realistic demo data.

Create:

### Users

```text
1 Admin
1 Operations Manager
1 Support Agent
3 Customers
5+ Providers
```

### Categories

```text
Plumbing
Electrical
AC Repair
Appliance Repair
Cleaning
Carpentry
Painting
Pest Control
```

### Skills

Create relevant skills for each category.

### Providers

Create providers with:

* Different skills
* Different ratings
* Different service areas
* Different availability
* Verified status

### Sample Requests

Create realistic service requests.

### Sample Quotes

Create quotes connected to requests.

### Sample Bookings

Create bookings with different statuses.

This will make the backend easy to test from Postman.

---

# 62. API Documentation

Create API documentation using either:

```text
Swagger / OpenAPI
```

or a detailed:

```text
README.md
```

Document every endpoint with:

* Method
* URL
* Authentication requirement
* Role requirement
* Request body
* Query parameters
* Response
* Error responses

---

# 63. Testing

Create backend tests for important business logic.

At minimum test:

## Authentication

```text
Register
Login
Invalid password
Duplicate email
Expired token
```

## Authorization

```text
Customer cannot access admin APIs
Provider cannot access another provider's data
Customer cannot modify another customer's booking
```

## Availability

```text
Valid booking
Overlapping booking
Unavailable provider
```

## Quotes

```text
Provider submits quote
Duplicate quote
Customer accepts quote
```

## Booking

```text
Create booking
Cancel booking
Status transitions
```

## AI

```text
Valid classification
Invalid AI response
AI timeout/failure
Fallback behavior
```

---

# 64. Business Rules

Implement these rules carefully.

### Provider

```text
Only verified providers can receive normal customer recommendations.
```

### Quote

```text
A provider cannot submit multiple active quotes for the same request.
```

### Booking

```text
A provider cannot have overlapping bookings.
```

### Customer

```text
A customer can accept only one quote for a request.
```

### Review

```text
Only customers associated with completed bookings can review providers.
```

### Dispute

```text
A dispute must be connected to an existing booking.
```

### Job

```text
Only the assigned provider can start and complete the job.
```

### Invoice

```text
Invoice should be generated only after the appropriate completion/confirmation stage.
```

---

# 65. Booking State Machine

Implement controlled status transitions.

Valid example:

```text
requested
    ↓
quoted
    ↓
provider_selected
    ↓
scheduled
    ↓
assigned
    ↓
en_route
    ↓
in_progress
    ↓
completed
    ↓
customer_confirmed
```

Do NOT allow arbitrary status changes.

For example:

```text
customer_confirmed → in_progress
```

should be rejected.

Create a service such as:

```text
bookingService.js
```

to manage status transitions.

---

# 66. AI Architecture

Keep AI separate from normal business logic.

```text
Express Controller
       ↓
AI Service
       ↓
AI Provider
       ↓
Structured Response
       ↓
Validation
       ↓
Business Logic
       ↓
MongoDB
```

AI should not directly modify MongoDB.

The backend should receive the AI response, validate it, and then decide what to save.

---

# 67. AI Responsibilities

AI should primarily perform:

## 1. Service Request Classification

Input:

```text
"My washing machine is making a strange noise."
```

Output:

```json
{
  "category": "Appliance Repair",
  "skills": [
    "Washing Machine Repair",
    "Appliance Diagnostics"
  ],
  "urgency": "medium"
}
```

## 2. Provider Recommendation Support

AI can help rank providers after deterministic filtering.

Inputs:

```text
Customer request
Required skills
Provider skills
Location
Availability
Rating
Experience
Historical performance
```

Output:

```json
{
  "recommendations": [
    {
      "providerId": "...",
      "reason": "Strong skill and availability match"
    }
  ]
}
```

The backend remains responsible for final validation and authorization.

---

# 68. Do Not Overuse AI

Do NOT use AI for:

```text
Authentication
Authorization
Booking conflict detection
Payment status
Invoice calculation
Role permissions
Database validation
Security
```

These must be deterministic backend logic.

AI should enhance the platform rather than replace normal application logic.

---

# 69. Backend Development Order

Build in this order:

```text
1. Project Setup
       ↓
2. MongoDB Connection
       ↓
3. User Model
       ↓
4. Authentication
       ↓
5. JWT Middleware
       ↓
6. RBAC
       ↓
7. Provider Model
       ↓
8. Category + Skill Models
       ↓
9. Service Requests
       ↓
10. AI Classification
       ↓
11. Availability
       ↓
12. Provider Matching
       ↓
13. Quotes
       ↓
14. Booking
       ↓
15. Job Management
       ↓
16. Evidence Upload
       ↓
17. Customer Confirmation
       ↓
18. Invoice
       ↓
19. Reviews
       ↓
20. Disputes
       ↓
21. Notifications
       ↓
22. Admin
       ↓
23. Operations
       ↓
24. Support
       ↓
25. Audit Logs
       ↓
26. Analytics
       ↓
27. Tests
       ↓
28. API Documentation
```

---

# 70. Important Development Instruction

Build the backend incrementally.

Do NOT create fake APIs or placeholder business logic just to make endpoints appear complete.

Each implemented endpoint should:

* Validate input.
* Authenticate the user where required.
* Check role permissions.
* Check resource ownership.
* Execute real business logic.
* Interact with MongoDB.
* Return consistent responses.
* Handle errors.
* Create relevant notifications/audit logs where required.

---

# 71. Do Not Build Frontend Yet

For this phase, focus exclusively on:

```text
Backend
MongoDB
REST APIs
Authentication
Authorization
Business Logic
AI Integration
Validation
Security
Testing
API Documentation
Seed Data
```

Do not create React components or frontend dashboards yet.

The backend must be ready for a future React frontend.

---

# 72. Final Backend Acceptance Criteria

The backend is considered complete when the following end-to-end flow works through APIs:

```text
1. Customer registers
2. Customer logs in
3. Provider registers
4. Admin verifies provider
5. Provider creates profile
6. Provider adds skills
7. Provider adds availability
8. Customer creates service request
9. AI classifies request
10. Backend identifies required skills
11. Backend finds suitable providers
12. Providers submit quotes
13. Customer views quotes
14. Customer accepts one quote
15. Backend checks availability
16. Booking is created
17. Provider receives notification
18. Provider starts job
19. Provider uploads evidence
20. Provider completes job
21. Customer confirms completion
22. Invoice is generated
23. Payment status is recorded
24. Customer submits review
25. Provider rating is updated
26. Customer can raise a dispute
27. Support can resolve dispute
28. Operations can monitor/reassign jobs
29. Admin can manage platform
30. Audit logs record important actions
```

---

# 73. Final Deliverables

The completed backend should contain:

```text
✓ Node.js + Express backend
✓ MongoDB + Mongoose
✓ JWT authentication
✓ bcrypt password hashing
✓ Five-role RBAC
✓ Resource ownership checks
✓ User management
✓ Provider management
✓ Provider verification
✓ Categories
✓ Skills
✓ Service requests
✓ AI classification
✓ AI provider matching
✓ Availability engine
✓ Quote system
✓ Booking system
✓ Booking state machine
✓ Job management
✓ Evidence uploads
✓ Customer confirmation
✓ Invoice system
✓ Payment status
✓ Reviews
✓ Disputes
✓ Cancellations
✓ Notifications
✓ Audit logs
✓ Admin APIs
✓ Operations APIs
✓ Support APIs
✓ Search and filtering
✓ Pagination
✓ Validation
✓ Error handling
✓ Security middleware
✓ Seed data
✓ Tests
✓ API documentation
✓ .env.example
✓ README
```

---

# 74. Final Instruction to Antigravity

Build this as a **real backend application**, not a static demo.

Prioritize:

```text
Correct Architecture
        ↓
Security
        ↓
Database Design
        ↓
Business Logic
        ↓
API Quality
        ↓
AI Integration
        ↓
Testing
```

The backend should be modular enough that a React frontend can consume the APIs without requiring changes to the core business logic.

Start by setting up the Node.js + Express project, MongoDB connection, environment configuration, folder structure, User model, authentication, JWT middleware, and RBAC.

Then implement the remaining modules in the development order defined above.

After each major module, ensure the application still runs correctly and the APIs are testable through Postman/Swagger.

Do not move to the next major module while the current module contains broken imports, missing routes, invalid schemas, or unhandled errors.
