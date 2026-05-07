# CarRental ERP - Project Documentation

## Overview

CarRental ERP is a complete car rental management platform built for UAE-based rental businesses. The system supports the full rental lifecycle from agreement creation to vehicle return, with dedicated interfaces for front desk staff, drivers, fleet managers, accounts teams, and customers.

**Tech Stack:** Node.js (Express) API · PostgreSQL · Next.js 16 (Web) · React Native/Expo (Mobile) · AWS S3 (Photo Storage)

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [API Layer (Backend)](#api-layer-backend)
3. [Database](#database)
4. [Web Frontend](#web-frontend)
5. [Mobile App](#mobile-app)
6. [User Roles & Permissions](#user-roles--permissions)
7. [Core Features](#core-features)
8. [Rental Agreement Lifecycle](#rental-agreement-lifecycle)
9. [API Endpoints](#api-endpoints)
10. [Key Services](#key-services)
11. [Setup & Installation](#setup--installation)

---

## Project Structure

```
carrental/
├── api/                    # Express.js backend API
│   ├── src/
│   │   ├── config/        # Database & S3 configuration
│   │   ├── controllers/   # Request handlers (18 controllers)
│   │   ├── models/        # Database models (25+ models)
│   │   ├── routes/        # API route definitions (18 route files)
│   │   ├── services/      # Business logic layer (20 services)
│   │   ├── middleware/     # Auth, rate-limit, tenant isolation, etc.
│   │   └── utils/         # Validation & photo metadata utilities
│   ├── tests/             # Unit tests (6 test suites)
│   ├── package.json
│   └── .env
├── database/               # Database migrations & seeds
│   ├── migrations/         # 18 SQL migration files
│   ├── seeds/              # Seed data (admin, staff, vehicles, customers)
│   ├── migrate.js          # Migration runner script
│   └── package.json
├── web/                    # Next.js 16 web frontend
│   ├── src/
│   │   ├── app/           # App router pages & layouts
│   │   │   ├── (dashboard)/  # Protected dashboard routes
│   │   │   │   ├── agreements/   # Agreement management
│   │   │   │   ├── vehicles/     # Vehicle management
│   │   │   │   ├── customers/    # Customer management
│   │   │   │   ├── invoices/     # Invoicing
│   │   │   │   ├── portal/       # Customer portal
│   │   │   │   ├── driver/      # Driver tasks
│   │   │   │   ├── admin/       # Admin dashboard, KPIs, users
│   │   │   │   ├── accounts/    # Deposits, payments, toll fines
│   │   │   │   ├── maintenance/ # Work orders & maintenance
│   │   │   │   └── rate-plans/  # Rate plan management
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # Auth context
│   │   ├── services/       # API client services
│   │   └── types/          # TypeScript type definitions
│   └── package.json
├── mobile/                 # React Native/Expo mobile app
│   ├── src/
│   │   ├── screens/        # Screen components by role
│   │   │   ├── admin/        # Admin dashboard, audit logs, KPIs
│   │   │   ├── accounts/     # Invoices, payments, deposits
│   │   │   ├── customer/     # Customer portal screens
│   │   │   ├── driver/       # Driver tasks, pickup, delivery, recovery
│   │   │   ├── fleet/        # Fleet management, maintenance
│   │   │   └── [core]        # Agreements, checkout, return
│   │   ├── navigation/     # Stack navigators per role
│   │   ├── components/     # Reusable mobile components
│   │   ├── services/       # API services & offline sync
│   │   ├── hooks/          # Custom hooks (auth, location, offline sync)
│   │   ├── contexts/       # Auth context
│   │   └── theme/           # App theme & colors
│   └── package.json
└── README.md
```

---

## API Layer (Backend)

**Location:** `api/`
**Runtime:** Node.js with Express.js
**Port:** 3000 (configurable via `PORT` env var)

### Key Dependencies
- `express` - Web framework
- `pg` - PostgreSQL client
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing
- `aws-sdk` - AWS S3 for photo storage
- `multer` - File upload handling
- `sharp` - Image processing
- `joi` - Request validation
- `helmet` & `cors` - Security middleware
- `express-rate-limit` - Rate limiting

### Entry Point (`api/src/index.js`)

The API server:
- Applies security middleware (Helmet, CORS)
- Registers all route modules under `/v1/` prefix
- Includes request logging and rate limiting
- Has a health check endpoint at `/health`
- Serves uploaded files statically from `/uploads`

### Middleware (`api/src/middleware/`)
| Middleware | Purpose |
|---|---|
| `auth.middleware.js` | JWT verification, user context injection |
| `tenant-isolation.middleware.js` | Multi-tenant data isolation |
| `immutability-check.middleware.js` | Prevents modifying active/closed agreements |
| `rate-limit.middleware.js` | API rate limiting (general + upload-specific) |
| `error-handler.middleware.js` | Centralized error handling |
| `logger.middleware.js` | Request/response logging |

---

## Database

**Engine:** PostgreSQL
**Migration Runner:** `database/migrate.js` (supports `--experimental-vm-modules` for ES modules)

### Migration Files (`database/migrations/`)

| # | File | Description |
|---|---|---|
| 001 | `001_create_rental_agreements.sql` | Rental agreements table, audit log, ENUM types |
| 002 | `002_create_evidence_tables.sql` | Checkout/return evidence, photo evidence |
| 003 | `003_add_immutability_triggers.sql` | Immutability triggers for agreements |
| 004 | `004_create_customers_vehicles.sql` | Customers, vehicles, categories, tenant rules |
| 005 | `005_create_users_otp_tables.sql` | Users, OTP for auth |
| 006 | `006_create_invoices_payments.sql` | Invoices, payments, auto-generated charges |
| 007 | `007_create_disputes.sql` | Dispute management |
| 008 | `008_create_notifications.sql` | Notification system |
| 009 | `009_create_messages.sql` | Customer-staff messaging |
| 010 | `010_create_password_reset_tokens.sql` | Password reset functionality |
| 011 | `011_create_driver_task_tables.sql` | Driver tasks, delivery, pickup, recovery |
| 012 | `012_create_vehicle_availability.sql` | Vehicle availability locking |
| 013 | `013_add_agreement_snapshot_fields.sql` | Rate plan snapshot fields |
| 014 | `014_create_rate_plans.sql` | Rate plans management |
| 015 | `015_create_deposits.sql` | Security deposit handling |
| 016 | `016_create_system_audit_log.sql` | System-wide audit logging |
| 017 | `017_create_toll_fine_events.sql` | Toll and fine tracking |
| 018 | `018_create_work_orders.sql` | Vehicle maintenance work orders |

### Seed Files (`database/seeds/`)
- `seed-admin-user.sql` - Creates default admin user
- `seed-test-staff.sql` - Test staff accounts
- `seed-test-vehicles.sql` - Sample vehicle data
- `seed-test-customer.sql` - Sample customer data
- `backfill-snapshot-fields.sql` - Backfills snapshot fields on existing agreements

### Key Database Models (`api/src/models/`)
- **Rental Agreement** (`rental-agreement.model.js`) - Core agreement with customer/vehicle joins
- **Vehicle** (`vehicle.model.js`) - Vehicle management with availability search
- **Customer** (`customer.model.js`) - Customer profiles with search
- **User** (`user.model.js`) - Staff/user authentication
- **Invoice** (`invoice.model.js`) - Invoicing with line items
- **Dispute** (`dispute.model.js`) - Dispute tracking
- **Deposit** (`deposit.model.js`) - Security deposit state machine
- **Rate Plan** (`rate-plan.model.js`) - Configurable rental rates
- **Vehicle Category** (`vehicle-category.model.js`) - Vehicle categorization
- **Work Order** (`work-order.model.js`) - Maintenance management
- **Toll Fine Event** (`toll-fine-event.model.js`) - Toll violation tracking
- **Notification** (`notification.model.js`) - User notifications
- **Message** (`message.model.js`) - Internal messaging
- **OTP** (`otp.model.js`) - One-time password auth
- **Refresh Token** (`refresh-token.model.js`) - JWT refresh tokens
- **Audit Logs** - Agreement audit & system audit logging
- **Evidence Models** - Checkout, return, photo evidence
- **Location Update** (`location-update.model.js`) - GPS tracking
- **Vehicle Availability** (`vehicle-availability.model.js`) - Availability locking
- **Tenant Rules** (`tenant-rules.model.js`) - Configurable business rules

---

## Web Frontend

**Location:** `web/`
**Framework:** Next.js 16.2.0 (App Router)
**Styling:** Tailwind CSS 4
**UI Components:** Recharts (charts), React Icons, React Hot Toast

### Key Pages (`web/src/app/(dashboard)/`)

#### Agreements
- `/agreements` - List with pagination, search, status filter
- `/agreements/create` - Create new draft agreement
- `/agreements/[id]` - Agreement details with customer/vehicle info
- `/agreements/[id]/edit` - Edit draft agreement
- `/agreements/[id]/checkout` - Checkout with photo evidence upload
- `/agreements/[id]/return` - Return with damage documentation

#### Vehicles
- `/vehicles` - Fleet list with status filters
- `/vehicles/create` - Add new vehicle
- `/vehicles/[id]` - Vehicle details
- `/vehicles/[id]/edit` - Edit vehicle

#### Customers
- `/customers` - Customer directory

#### Admin
- `/admin/kpis` - KPI dashboard with charts
- `/admin/reports` - Reports generation
- `/admin/users` - User management
- `/admin/users/[id]` - User details

#### Accounts
- `/accounts` - Accounts dashboard
- `/accounts/deposits` - Deposit tracking
- `/accounts/payments` - Payment records
- `/accounts/toll-fines` - Toll fine management

#### Customer Portal
- `/portal` - Customer dashboard
- `/portal/rentals` - My rentals
- `/portal/invoices` - My invoices
- `/portal/disputes` - My disputes
- `/portal/messages` - Messages
- `/portal/notifications` - Notifications

#### Other
- `/maintenance` - Work orders & maintenance schedule
- `/rate-plans` - Rate plan management
- `/driver` - Driver task dashboard
- `/login` - Login page

### Shared Components (`web/src/components/`)
- `DataTable.tsx` - Reusable table with sorting/pagination
- `Sidebar.tsx` - Navigation sidebar
- `PageHeader.tsx` - Page title with breadcrumbs
- `StatsCard.tsx` - KPI stat cards
- `StatusBadge.tsx` - Color-coded status badges
- `Pagination.tsx` - Pagination controls
- `SearchInput.tsx` - Search input with debounce
- `Modal.tsx` - Modal dialog
- `ConfirmDialog.tsx` - Confirmation dialog
- `LoadingSpinner.tsx` / `Spinner.tsx` - Loading states
- `Button.tsx` - Reusable button component
- `Providers.tsx` - App providers (Auth, etc.)

---

## Mobile App

**Location:** `mobile/`
**Framework:** React Native with Expo (SDK 54)
**Navigation:** React Navigation 6 (stack navigators per role)

### Role-Based Navigation Stacks (`mobile/src/navigation/`)
| Stack | Role | Purpose |
|---|---|---|
| `AuthStack.tsx` | All | Login screen |
| `FrontDeskStack.tsx` | FRONT_DESK | Agreement creation, checkout, return |
| `CustomerStack.tsx` | RENTAL_CUSTOMER | Customer portal on mobile |
| `OwnerAdminStack.tsx` | OWNER_ADMIN, SUPER_ADMIN | Full admin access |
| `DriverRecoveryStack.tsx` | DRIVER_RECOVERY | Pickup, delivery, recovery tasks |
| `FleetManagerStack.tsx` | FLEET_MANAGER | Vehicle & maintenance management |
| `AccountsStack.tsx` | ACCOUNTS | Invoices, payments, deposits |

### Mobile Screens by Role

#### Front Desk (`mobile/src/screens/`)
- `LoginScreen.tsx` - Staff login
- `AgreementListScreen.tsx` - View all agreements
- `AgreementCreateScreen.tsx` - Create draft agreement
- `AgreementEditScreen.tsx` - Edit draft
- `AgreementViewScreen.tsx` - Agreement details
- `CheckoutScreen.tsx` - Vehicle checkout with photos
- `ReturnScreen.tsx` - Vehicle return with damage docs

#### Admin (`mobile/src/screens/admin/`)
- `AdminDashboardScreen.tsx` - Admin dashboard
- `UserListScreen.tsx` / `UserCreateScreen.tsx` / `UserEditScreen.tsx` - User management
- `KpiDashboardScreen.tsx` - KPI metrics
- `AuditLogScreen.tsx` - System audit trail
- `ReportsScreen.tsx` - Reports
- `SettingsScreen.tsx` - App settings
- `StaffLoginScreen.tsx` - Staff authentication

#### Fleet Manager (`mobile/src/screens/fleet/`)
- `FleetDashboardScreen.tsx` - Fleet overview
- `FleetVehicleListScreen.tsx` - Vehicle list
- `FleetVehicleFormScreen.tsx` - Add/edit vehicle
- `FleetVehicleDetailScreen.tsx` - Vehicle details
- `MaintenanceListScreen.tsx` - Maintenance schedule
- `WorkOrderDetailScreen.tsx` - Work order details

#### Driver (`mobile/src/screens/driver/`)
- `DriverDashboardScreen.tsx` - Task dashboard
- `TaskDetailScreen.tsx` - Task details
- `TaskHistoryScreen.tsx` - Completed tasks
- `PickupScreen.tsx` - Vehicle pickup
- `DeliveryScreen.tsx` - Vehicle delivery
- `RecoveryScreen.tsx` - Vehicle recovery

#### Accounts (`mobile/src/screens/accounts/`)
- `AccountsDashboardScreen.tsx` - Accounts overview
- `AccountsInvoiceListScreen.tsx` / `AccountsInvoiceDetailScreen.tsx` - Invoices
- `AccountsPaymentListScreen.tsx` - Payments
- `DepositListScreen.tsx` - Deposits
- `TollFineListScreen.tsx` - Toll fines
- `AccountsReportsScreen.tsx` - Financial reports

#### Customer Portal (`mobile/src/screens/customer/`)
- `CustomerDashboardScreen.tsx` - Dashboard
- `MyRentalsScreen.tsx` - Active rentals
- `CustomerAgreementDetailScreen.tsx` - Agreement details
- `InvoiceListScreen.tsx` / `InvoiceDetailScreen.tsx` - Invoices
- `DisputeListScreen.tsx` / `DisputeDetailScreen.tsx` / `CreateDisputeScreen.tsx` - Disputes
- `MessagesScreen.tsx` / `ChatThreadScreen.tsx` - Messaging
- `NotificationsScreen.tsx` - Notifications
- `ProfileScreen.tsx` - Profile management

### Mobile Components (`mobile/src/components/`)
- `PhotoCapture.tsx` - Camera integration for evidence
- `PhotoGallery.tsx` - Photo gallery viewer
- `SignatureCapture.tsx` - Digital signature capture
- `DamageDocumentation.tsx` - Damage reporting UI
- `EvidenceChecklist.tsx` - Checklist for checkout/return
- `FuelLevelPicker.tsx` - Fuel level selection
- `ChargeBreakdown.tsx` / `ChargeBreakdownDetail.tsx` - Charge display
- `DepositStatusBadge.tsx` - Deposit status indicator
- `TaskCard.tsx` - Task card component
- `CustomerSearchModal.tsx` / `VehicleSearchModal.tsx` - Search modals

### Mobile Services & Hooks
- **Services:** `api-client.ts`, `auth-api.service.ts`, `agreement-api.service.ts`, `vehicle-api.service.ts`, `customer-api.service.ts`, `customer-portal-api.service.ts`, `driver-task-api.service.ts`, `admin-api.service.ts`, `accounts-api.service.ts`, `camera.service.ts`, `gps.service.ts`, `offline-sync.service.ts`
- **Hooks:** `useAuth.ts`, `useAgreementLifecycle.ts`, `useLocationTracking.ts`, `useOfflineSync.ts`, `usePhotoCapture.ts`
- **Contexts:** `AuthContext.tsx` - Authentication state management

---

## User Roles & Permissions

| Role | Description | Access |
|---|---|---|
| `SUPER_ADMIN` | Full system access | All features |
| `OWNER_ADMIN` | Business owner | All features except super-admin settings |
| `FRONT_DESK` | Rental desk staff | Agreements, customers, vehicles, checkout/return |
| `FLEET_MANAGER` | Fleet operations | Vehicles, maintenance, work orders |
| `DRIVER_RECOVERY` | Drivers & recovery team | Tasks, pickup, delivery, recovery |
| `ACCOUNTS` | Finance team | Invoices, payments, deposits, toll fines |
| `RENTAL_CUSTOMER` | Customers | Customer portal (own rentals, invoices, disputes) |

### Role-Based Route Protection
- Backend: `requireRole()` middleware in routes
- Web: Server-side role checks in page components
- Mobile: `RootNavigator` routes to appropriate stack based on `user.role`

---

## Core Features

### 1. Rental Agreement Management
- Create draft agreements with customer & vehicle selection
- Automatic agreement number generation (`RA-YYYY-NNNNN`)
- Checkout process with photo evidence & odometer reading
- Return process with damage documentation
- Agreement lifecycle: **DRAFT → ACTIVE → CLOSED**
- Immutability: Agreements become immutable upon activation

### 2. Vehicle Management
- Add/edit vehicles with details (make, model, year, plate, etc.)
- Categorization with rate defaults
- Status tracking: AVAILABLE, RENTED, MAINTENANCE, OUT_OF_SERVICE
- Availability locking during rental periods
- Maintenance scheduling with work orders

### 3. Customer Management
- Customer profiles (individual & corporate)
- Arabic & English name support
- Emirates ID & driving license tracking
- Blacklist functionality
- Customer number generation (`CUS-NNNNN`)

### 4. Rate Plans
- Configurable rate plans with included km, extra km rates
- Fuel policy configuration
- Late return rules
- Add-ons and terms text
- Snapshot stored in agreement at activation time

### 5. Evidence & Documentation
- Checkout evidence (photos, odometer, fuel level, damage)
- Return evidence (photos, odometer, fuel level, damage)
- Photo storage via AWS S3
- Digital signature capture
- Evidence checklist validation

### 6. Automated Charges
- **Extra KM charges** - Based on snapshot rates
- **Fuel charges** - Refill rate calculation
- **Late fees** - Hourly with grace period
- **Damage charges** - Flagged for approval
- All charges linked to rule version for audit

### 7. Invoicing
- Auto-generated invoices on agreement closure
- Invoice line items from charges
- Invoice issuance workflow
- Customer invoice portal

### 8. Dispute Management
- Customers can create disputes
- Dispute tracking with status
- Resolution workflow

### 9. Toll & Fine Management
- Toll violation event tracking
- Fine association with agreements
- Payment tracking

### 10. Maintenance & Work Orders
- Vehicle work order management
- Maintenance scheduling
- Status tracking (open, in_progress, completed)
- Next maintenance km/date tracking

### 11. Deposits
- Security deposit collection on checkout
- Deposit state machine (PENDING → COLLECTED → REFUNDED)
- Refund processing

### 12. Notifications & Messaging
- In-app notification system
- Customer-staff messaging
- Automated notifications (rental started, ended, etc.)

### 13. KPIs & Reporting
- Dashboard KPI metrics
- Revenue, utilization, fleet metrics
- Report generation (admin screens)

### 14. Audit & Compliance
- Agreement audit trail (all status changes)
- System-wide audit log
- Immutable agreement records
- Rule versioning for charge calculations

### 15. Mobile-Specific Features
- Offline sync capability (`useOfflineSync`)
- GPS location tracking (`useLocationTracking`)
- Camera integration for evidence capture
- Push notifications ready

---

## Rental Agreement Lifecycle

```
[DRAFT] --activate--> [ACTIVE] --close--> [CLOSED]
  |                        |                      |
  +-- Edit details         +-- Checkout           +-- Return
  +-- Add customer           evidence              evidence
  +-- Select vehicle      +-- Photo upload       +-- Auto charges
  +-- Set dates           +-- Odometer           +-- Invoice gen
  +-- Choose rate plan    +-- Fuel level         +-- Notification
                          +-- Deposit collect
                          +-- Notify customer
```

### Snapshot Mechanism
When an agreement is activated, the following are snapshotted into the agreement record:
- Rate plan details (name, included km, extra km rate)
- Deposit amount
- Fuel policy
- Late return rules
- Add-ons
- Terms text

This ensures charges are calculated against the rules at activation time, not current rules.

---

## API Endpoints

**Base URL:** `http://localhost:3000/v1`

### Authentication
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/auth/*` | Customer auth (login, register, OTP) | Public |
| POST | `/auth/staff/*` | Staff login | Public |

### Agreements
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/agreements` | Create draft agreement | FRONT_DESK, OWNER_ADMIN |
| PATCH | `/agreements/:id` | Update draft | FRONT_DESK, OWNER_ADMIN |
| GET | `/agreements` | List agreements | FRONT_DESK, Admin, Customer |
| GET | `/agreements/:id` | Get agreement details | FRONT_DESK, Admin, Customer |
| POST | `/agreements/:id/checkout` | Checkout (activate) | FRONT_DESK, OWNER_ADMIN |
| POST | `/agreements/:id/return` | Return (close) | FRONT_DESK, OWNER_ADMIN |
| GET | `/agreements/:id/evidence` | Get evidence | FRONT_DESK, Admin, Customer |
| GET | `/agreements/:id/charges` | Get charges | FRONT_DESK, Admin, Customer |

### Customers
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET, POST | `/customers/*` | Customer CRUD | FRONT_DESK, Admin |

### Vehicles
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET, POST, PATCH | `/vehicles/*` | Vehicle CRUD | FRONT_DESK, FLEET_MANAGER, Admin |

### Invoices
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET, POST | `/invoices/*` | Invoice management | ACCOUNTS, Admin, Customer |

### Disputes
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET, POST, PATCH | `/disputes/*` | Dispute management | FRONT_DESK, Admin, Customer |

### Driver Tasks
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET, POST, PATCH | `/driver/*`, `/tasks/*` | Task management | DRIVER_RECOVERY, FLEET_MANAGER |

### Admin
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET, POST, PATCH | `/admin/users/*` | User management | OWNER_ADMIN, SUPER_ADMIN |
| GET | `/admin/*` | Dashboard data | OWNER_ADMIN, SUPER_ADMIN |
| GET | `/kpis/*` | KPI metrics | OWNER_ADMIN, SUPER_ADMIN |
| GET | `/audit-log/*` | Audit trails | OWNER_ADMIN, SUPER_ADMIN |

### Other
| Method | Endpoint | Endpoint | Access |
|---|---|---|---|
| Various | `/rate-plans/*` | Rate plan management | FRONT_DESK, Admin |
| Various | `/deposits/*` | Deposit management | ACCOUNTS, Admin |
| Various | `/toll-fines/*` | Toll fine tracking | ACCOUNTS, Admin |
| Various | `/maintenance/*` | Work orders | FLEET_MANAGER, Admin |
| Various | `/customer/*` | Customer portal API | RENTAL_CUSTOMER |

---

## Key Services

### Business Logic Services (`api/src/services/`)

| Service | Purpose |
|---|---|
| `agreement.service.js` | Agreement lifecycle, activation, closure, charges |
| `customer.service.js` | Customer CRUD & search |
| `vehicle.service.js` | Vehicle CRUD & availability |
| `auth.service.js` | JWT auth, OTP verification |
| `staff-auth.service.js` | Staff authentication |
| `invoice.service.js` | Invoice generation & issuance |
| `dispute.service.js` | Dispute workflow |
| `deposit.service.js` | Deposit state machine |
| `evidence.service.js` | Checkout/return evidence |
| `rule-engine.service.js` | Business rule evaluation |
| `availability.service.js` | Vehicle availability locking |
| `audit-log.service.js` | Agreement audit trail |
| `notification.service.js` | In-app notifications |
| `message.service.js` | Customer-staff messaging |
| `otp.service.js` | OTP generation & verification |
| `photo-storage.service.js` | AWS S3 photo uploads |
| `location-tracking.service.js` | GPS tracking |
| `driver-task.service.js` | Driver task management |
| `toll-fine.service.js` | Toll fine processing |
| `maintenance.service.js` | Work order management |
| `kpi.service.js` | KPI calculations |
| `admin-reports.service.js` | Report generation |
| `admin-user.service.js` | Admin user management |

---

## Setup & Installation

### Prerequisites
- Node.js >= 18
- PostgreSQL database
- AWS S3 bucket (for photo storage)
- npm or yarn

### 1. Clone & Install Dependencies

```bash
# API
cd api
npm install

# Web
cd web
npm install

# Mobile
cd mobile
npm install

# Database tools
cd database
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` in each directory:

**API (`api/.env`):**
```
DATABASE_URL=postgresql://user:password@localhost:5432/carrental
JWT_SECRET=your-jwt-secret
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
PORT=3000
NODE_ENV=development
```

**Web (`web/.env.local`):**
```
NEXT_PUBLIC_API_URL=http://localhost:3000/v1
```

**Mobile (`mobile/.env`):**
```
API_URL=http://localhost:3000/v1
```

### 3. Database Setup

```bash
cd database
node migrate.js up
psql -d carrental -f seeds/seed-admin-user.sql
psql -d carrental -f seeds/seed-test-staff.sql
psql -d carrental -f seeds/seed-test-vehicles.sql
psql -d carrental -f seeds/seed-test-customer.sql
```

### 4. Run the Applications

```bash
# API (Terminal 1)
cd api
npm run dev    # Uses nodemon for auto-reload

# Web (Terminal 2)
cd web
npm run dev    # Next.js dev server on port 3000

# Mobile (Terminal 3)
cd mobile
npx expo start
# Then press 'a' for Android or 'i' for iOS
```

### 5. Run Tests

```bash
cd api
npm test                    # Unit tests
npm run test:integration    # Integration tests
npm run test:contract       # Contract tests
npm run test:all            # All tests
```

---

## Summary

CarRental ERP is a full-featured car rental management platform with:

- **18 database migrations** defining a comprehensive schema
- **25+ data models** covering all business entities
- **18 API route modules** with role-based access control
- **20 service modules** encapsulating business logic
- **Next.js 16 web frontend** with 40+ pages across 10+ modules
- **React Native/Expo mobile app** with 50+ screens for 6 user roles
- **Multi-tenant architecture** with tenant isolation
- **Complete audit trail** with immutable agreement records
- **Automated charge calculation** with rule snapshotting
- **Photo evidence capture** with AWS S3 storage
- **Offline-capable mobile app** with sync capabilities
- **KPI dashboards** and reporting for management
- **Customer self-service portal** (web & mobile)
