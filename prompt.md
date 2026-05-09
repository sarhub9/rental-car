You are a senior SaaS architect and ERP product engineer.

I have an existing Car Rental CRM/ERP codebase.
Your task is to UPGRADE and RESTRUCTURE it based on the attached 
"Car Rental CRM/ERP Master Guide (Pro-Level Blueprint)".

IMPORTANT:
- Do NOT rewrite everything from scratch.
- Analyze existing architecture first.
- Extend and refactor modules cleanly.
- Preserve backward compatibility.
- Follow production-grade standards.

=====================================================
PRIMARY OBJECTIVE
=====================================================

Transform the current system into a world-class rental ERP that includes:

• Online reservations + counter rentals + leasing
• Digital agreements with e-sign + inspection photos
• Toll / fine attribution by date/time
• Fleet health + maintenance scheduling
• Deposits, split payments, auto invoices
• Audit logs + role-based permissions
• Snapshot pricing integrity inside contracts
• Full accounting-ready financial flow

=====================================================
STEP 1 — ARCHITECTURE REVIEW
=====================================================

1. Analyze current:
   - Database schema
   - Modules
   - Auth & roles
   - Payment handling
   - Reservation logic
   - Contract logic
   - Vehicle status logic

2. Identify:
   - Missing entities
   - Poor normalization
   - Logic duplication
   - Security gaps
   - Financial control risks

Return:
• Gap analysis report
• Refactor proposal
• Migration impact summary

=====================================================
STEP 2 — DATA MODEL UPGRADE (CRITICAL)
=====================================================

Implement or Refactor These Core Entities:

Vehicle
VehicleAvailability
Customer
CorporateAccount
RatePlan
Reservation
RentalAgreement (WITH SNAPSHOT FIELDS)
Inspection
Charge
Payment
Deposit
Invoice
WorkOrder
Fine/TollEvent
Incident/Claim

Golden Rule:
At checkout, snapshot pricing terms inside RentalAgreement:
- base rate
- included km
- extra km rate
- fuel policy
- add-ons
- deposit rules
- VAT rules

Prevent future pricing rule edits from affecting old contracts.

=====================================================
STEP 3 — CORE WORKFLOW IMPLEMENTATION
=====================================================

Implement or Improve:

1. Fleet Onboarding Flow
   - Required compliance fields
   - Document uploads
   - Expiry reminders
   - Auto maintenance schedule seed

2. Reservation Workflow
   - Draft → Confirmed → Assigned → Checked Out
   - Class booking support
   - Availability lock system
   - Double-booking prevention

3. Agreement Checkout Flow
   - Identity verification
   - Vehicle lock
   - Inspection OUT
   - Snapshot pricing
   - Deposit collection
   - E-signature
   - Auto PDF generation
   - Status change → On Rent

4. Return Workflow (AUTO PROFIT CAPTURE)
   Auto-calc:

   Extra KM:
   max(0, (km_in - km_out) - included_km) * extra_km_rate

   Late fee:
   grace → hourly → daily cap

   Fuel difference charge

   Toll/Fine injection

   Damage estimate

   Final invoice auto-generation

   Deposit adjustment

=====================================================
STEP 4 — FINANCIAL CONTROLS
=====================================================

Implement:

• Split payments
• Pre-authorization support
• Sequential invoice numbering
• VAT-ready invoices
• Refund approval system
• Daily cash drawer sessions
• A/R aging for corporate accounts
• Deposit lifecycle tracking:
  held → used → released → forfeited

=====================================================
STEP 5 — MAINTENANCE MODULE
=====================================================

Work Order Flow:
Create → Assign Vendor → Parts/Labor → Approval → Complete → Reset intervals

Automations:
• Due soon list
• Overdue block rental
• Cost per km tracking
• Downtime tracking

=====================================================
STEP 6 — TOLL / FINE ATTRIBUTION ENGINE
=====================================================

Build matching logic:

Input:
plate + datetime

Logic:
Match contract where:
contract.start <= event.time <= contract.end

If multiple matches → flag conflict
If no match → un-attributed queue

Add:
Admin fee logic (configurable)

=====================================================
STEP 7 — ROLE-BASED PERMISSIONS
=====================================================

Roles:
Owner / Super Admin
Branch Manager
Counter Agent
Fleet Manager
Accountant
Customer (Portal)

Add:
• Per-branch data isolation
• Approval thresholds for:
  - Discounts
  - Refunds
  - Write-offs
  - Deposit releases
• Immutable audit logs

=====================================================
STEP 8 — KPI DASHBOARD
=====================================================

Build analytics layer for:

Fleet:
• Utilization %
• Idle days
• Downtime

Revenue:
• Revenue per day per vehicle
• Base vs extras
• Discount leakage

Risk:
• Damage frequency
• Chargebacks
• Pending tolls

Operations:
• Avg checkout time
• No-show rate

Profitability:
• Maintenance cost per km
• Gross margin per vehicle

=====================================================
STEP 9 — INTEGRATIONS READY ARCHITECTURE
=====================================================

Prepare system for:

• Payment gateways
• Telematics
• SMS/WhatsApp reminders
• Accounting export
• API / Webhooks

Use service-layer architecture.

=====================================================
STEP 10 — IMPLEMENTATION PHASE PLAN
=====================================================

Break into:

MVP
V1
V2

Include:
• Migration plan
• Backward compatibility notes
• QA checklist
• Edge case validation list

=====================================================
DELIVERABLE FORMAT
=====================================================

For each module provide:

• Database schema changes
• API endpoints
• Business logic layer
• Validation rules
• UI screen requirements
• Automation triggers
• Risk controls

Focus on clean architecture, scalability, and audit safety.
Assume this is a multi-branch rental business.

Do not oversimplify.
Think like enterprise SaaS.


Use DDD (Domain Driven Design) principles.
Separate domain logic from controllers.
Avoid fat controllers.
Write business rules in service layer.
Design for future microservices transition.