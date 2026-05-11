FULL PROFESSIONAL CAR RENTAL ERP
/ CRM PLAN
A-to-Z enterprise workflow specification for a UAE car rental business
Document Purpose
This document explains exactly what a professional car rental ERP must contain, what fields each module needs, and how the full
business workflow should run from vehicle purchase to customer rental, agreement, payments, return, accounting, reports, and audit
control.
Core principle: Customer pays, driver drives, staff delivers/collects, vehicle
earns, accounting records, reports control the business.
Professional Car Rental ERP / CRM Plan Page 2
1. Executive Summary
- The ERP must run the whole car rental business without depending on Excel, manual registers, or separate
accounting sheets.
- Every module must be connected: vehicle, customer, driver, agreement, payment, Salik, fines, maintenance,
damage, accounting, and reports.
- The system must support walk-in rentals, online bookings, company customers, corporate accounts, multi-branch
operation, and staff mobile workflows.
- The system must be built around controls: required documents, expiry alerts, payment status, credit limits, vehicle
availability, audit logs, and role permissions.
Main modules
Area Modules required
Operations Dashboard, reservations, rental agreements, vehicle handover, vehicle return, tasks
Fleet Vehicle master, documents, pricing, availability, maintenance, damages, insurance, registration
Customer & Driver Resident, tourist, company, corporate, authorized drivers, additional drivers, blacklist
Finance Invoices, payments, deposits, customer ledger, corporate ledger, VAT, expenses, bank/cash, profit/loss
Compliance Document expiry, license expiry, Mulkiya expiry, insurance expiry, trade license expiry, audit logs
Growth Customer portal, staff app, WhatsApp/email automation, reports, API integrations, online booking
2. System Roles and Permissions
The ERP must have strict user roles. Staff should only see and change what they are allowed to manage. Every
action must be recorded in the audit log.
Role Allowed access Must not access
Super Admin Full system, settings, users, delete/restore, all reports, all
branches
No restriction
Owner/Director Dashboards, financial reports, approvals, branch reports,
profitability
Technical settings if not required
Branch Manager Own branch vehicles, contracts, staff tasks, branch
payments, branch reports
Other branch private accounting unless allowed
Reservation Agent Create customers, drivers, bookings, contracts, upload
documents
Delete accounting entries, change VAT,
approve refunds
Accountant Invoices, payments, deposits, VAT, expenses, ledgers,
statements
Vehicle technical edits unless allowed
Cashier Receive payments, print receipts, daily cash closing Edit invoices after approval, delete receipts
Maintenance Manager Service jobs, workshop status, repair costs, damage
estimates
Customer private financial data
Delivery/Collection Staff Assigned tasks, inspection photos, KM/fuel, customer
signature
Accounting reports, customer ledger
3. Dashboard - Pro-Level Business Control Screen
The dashboard is not only charts. It is the command center. It must show urgent problems first, then money, then
fleet, then tasks.
Dashboard blocks
Professional Car Rental ERP / CRM Plan Page 3
Block What it shows Action buttons
Fleet Health Total cars, available, rented, reserved, workshop, accident, out of
service
Add vehicle, transfer vehicle, open fleet
report
Today Operations Today pickups, today returns, overdue cars, pending inspections Create agreement, close agreement,
assign staff
Money Status Today collections, monthly revenue, receivables, deposits held, VAT
payable
Receive payment, view ledger, create
invoice
Alerts Expired IDs, expired licenses, insurance expiry, Mulkiya expiry,
maintenance due
Open alert, update document, block
rental
Corporate Control Corporate due, credit limit usage, monthly invoices pending Generate statement, send reminder
Staff Tasks Delivery, collection, inspection, payment collection tasks Assign task, mark complete
Dashboard rules
- Red alerts must show expired documents, overdue returns, unpaid contracts, and vehicle not returned.
- Dashboard filters must include branch, date range, vehicle category, customer type, contract status, and staff user.
- Top KPI cards must be clickable so the user can open the exact list behind each number.
- Owner dashboard and branch dashboard must be different if the business has multiple branches.
4. Vehicle / Fleet Module
The vehicle module is the heart of the rental ERP. Each car must have one master profile connected to documents,
pricing, status, agreements, Salik tag, fines, maintenance, expenses, damages, and profitability.
Add vehicle fields
Step Fields required System rule
Basic identity Plate number, traffic code, chassis/VIN, make, model, year, color, body type,
seats, transmission, fuel type
Plate number and VIN cannot be
duplicated.
Ownership Owned by company, investor owned, leased, financed, purchase date,
purchase price, supplier, investor name
Investor vehicles must link to
investor profit report.
Documents Mulkiya number, registration expiry, insurance company, policy number,
insurance expiry, mortgage/finance docs
System must create expiry alerts
before documents expire.
Rental pricing Daily, weekly, monthly rates, special rates, deposit, allowed KM, extra KM fee,
delivery fee
Pricing can be
branch/category/customer-type
specific.
Availability Current branch, parking location, current KM, fuel level, current status, cleaning
status
Only available and approved cars
can be selected in reservation.
Tracking Salik tag, GPS device, fuel card, tracker provider, device IMEI Salik/fines/GPS must link to the
vehicle.
Photos/condition Front, rear, sides, interior, tire photos, spare key, accessories, inspection
checklist
Handover comparison uses these
photos.
Vehicle statuses
Status Meaning What system allows
Available Ready for rent Can be reserved or rented
Reserved Booked for future pickup Cannot be double-booked at same date/time
Rented Active agreement exists Cannot be assigned to another contract
Due Return Return date/time reached Show in dashboard and send alert
Professional Car Rental ERP / CRM Plan Page 4
Status Meaning What system allows
Overdue Customer did not return on time Auto late charge and warning
Workshop Under maintenance Cannot be rented
Accident/Damage Damage case open Cannot be rented until approved
Out of Service Blocked by admin Hidden from reservation
Sold Removed from active fleet Keep history and accounting records
5. Customer, Company, Corporate, and Driver Structure
Important professional structure
Do not mix customer and driver in one simple form. Customer is the billing account. Driver is the person allowed to drive. Staff driver
is internal employee for delivery, collection, and vehicle movement. Agreement connects customer + driver + vehicle + payment.
Customer account types
Type Purpose Required documents
UAE Resident Individual living in UAE renting personally Emirates ID, UAE driving license, optional
passport/visa
Tourist Visitor renting personally Passport, visa/entry stamp, home country
license, international driving permit if required
Company Customer Company rents for business use Trade license, VAT certificate, authorized
signatory ID/passport, authorization letter
Corporate Account Large repeated client with credit/monthly billing Corporate agreement, trade license, VAT
certificate, signatory documents, credit terms,
approved driver list
Customer add workflow
- Step 1: Select customer type: Resident, Tourist, Company, or Corporate.
- Step 2: System shows only required fields and documents for that type.
- Step 3: Enter customer/company details and upload documents.
- Step 4: System validates duplicate mobile, Emirates ID, passport, trade license, or email.
- Step 5: System checks document expiry and marks profile Active, Pending Verification, Expired Documents,
Blacklisted, or VIP.
- Step 6: Customer ledger is automatically created for invoices, payments, deposits, refunds, Salik, fines, and
damage charges.
Driver add workflow
Driver type Where added Required checks
Main customer driver Inside customer profile or agreement License valid, ID/passport valid, not blacklisted
Additional driver Inside agreement or customer profile Additional driver fee, license validity, signature if
required
Company driver Inside company account Authorization from company, license validity
Corporate authorized driver Inside corporate approved driver list Branch access, vehicle category permission, license
validity
Staff/internal driver Staff module Employee active, license valid, assigned branch, task
permissions
Professional Car Rental ERP / CRM Plan Page 5
6. Reservation Module
Reservation is a booking before rental agreement. It must protect vehicle availability, calculate estimated charges,
and hold customer/vehicle details until pickup.
Reservation workflow
Step User action System action
1 Select pickup branch, return branch, pickup
date/time, return date/time
System searches only vehicles available in that period.
2 Choose vehicle category or exact car System blocks double booking and shows pricing.
3 Select existing customer or add new customer System checks documents, balance, blacklist, credit limit.
4 Select driver or add driver System checks license validity and required documents.
5 Add pricing, deposit, delivery, extras, discount System calculates rental, VAT, deposit, total estimated amount.
6 Save as draft, pending, or confirmed System sends confirmation and updates vehicle calendar.
7 Convert reservation to agreement at pickup System carries all details into rental agreement.
Reservation statuses
- Draft
- Pending confirmation
- Confirmed
- Awaiting deposit
- Cancelled
- No-show
- Converted to agreement
- Expired
7. Rental Agreement Module
The rental agreement is the legal and financial center. It connects customer, driver, vehicle, price, deposit,
documents, inspection, signature, payment, invoice, and vehicle status.
Agreement creation workflow
Stage What happens Blocking rules
Select source Create from reservation or direct rental Direct rental still must check vehicle availability.
Select customer Resident/tourist/company/corporate account Blocked if customer is blacklisted or has unpaid
overdue balance beyond limit.
Select driver Same as customer, existing driver, or add new driver Blocked if license expired or missing required
documents.
Select vehicle Only available vehicle list Blocked if rented, workshop, accident, expired
insurance/registration.
Pricing Daily/weekly/monthly, allowed KM, extra KM, delivery, discount,
VAT
Discount above limit requires manager approval.
Deposit/payment Cash/card/bank/corporate credit, deposit held Agreement cannot start if required deposit is
missing unless approved credit account.
Handover
inspection
KM, fuel, photos, damage marks, accessories, key count Agreement cannot start until inspection is
completed.
Professional Car Rental ERP / CRM Plan Page 6
Stage What happens Blocking rules
Signature/PDF Customer signature, staff signature, company stamp if needed Agreement PDF is generated and stored.
Activate Vehicle status changes Available -> Rented Accounting and dashboard update instantly.
Agreement must include
- Agreement number, branch, staff user, start date/time, expected return date/time.
- Customer account details and billing party details.
- Driver details and additional driver details.
- Vehicle details, plate number, current KM, fuel, documents.
- Rental rate, deposit, VAT, allowed KM, extra KM charge, late fee, delivery fee, insurance option.
- Terms and conditions, signature, payment receipts, invoice references.
8. Vehicle Handover and Delivery Workflow
Handover protects the company from disputes. The system must record the exact condition of the vehicle before the
customer receives it.
Checkpoint Required data Why important
KM and fuel Current odometer, fuel level, fuel photo Used for extra KM and fuel charge on return.
Damage photos Front, rear, left, right, roof, tires, interior, dashboard Used for before/after damage comparison.
Accessories Spare tire, jack, tools, charger, child seat,
documents, key count
Prevents missing item disputes.
Delivery staff Assigned employee, delivery location, customer
signature
Creates staff accountability.
Payment confirmation Deposit/payment receipt or corporate credit
approval
Prevents unpaid vehicle release.
9. Vehicle Return and Final Settlement Workflow
Vehicle return must automatically calculate final charges and close the agreement only after inspection, payments,
and deposit settlement are completed.
Step Return action ERP calculation
1 Select active agreement and start return System shows expected return, balance, deposit, pending
charges.
2 Enter return KM and fuel System calculates extra KM and fuel difference.
3 Upload return photos and damage checklist System compares with handover condition.
4 Add late return, cleaning, damage, missing item charges System adds charges to final invoice.
5 Attach pending Salik/fines if available System charges customer or keeps pending if fine not
received yet.
6 Generate final invoice VAT, charges, payments, deposit deductions are calculated.
7 Refund or deduct deposit Deposit status becomes refunded, partial used, fully used, or
pending refund.
8 Close contract Vehicle status becomes Available, Workshop, or Damage
depending inspection result.
10. Accounting and Finance Module
Professional Car Rental ERP / CRM Plan Page 7
Accounting must work like a professional business system. Every operational action must create financial records
automatically.
Finance submodules
Submodule What it manages
Invoices Rental invoices, extension invoices, Salik invoices, fine invoices, damage invoices, corporate monthly
invoices
Payments Cash, card, bank transfer, online payment, corporate credit, refunds
Deposits Deposit received, held, deducted, refunded, pending refund
Customer ledger Every debit/credit for each customer with running balance
Corporate ledger Monthly billing, credit limit, aging, branch-wise statement
Expenses Vehicle expenses, maintenance, insurance, rent, salaries, utilities, marketing
Cash and bank Cash drawer, daily closing, bank accounts, transfers, reconciliation
VAT VAT collected, VAT on expenses, VAT payable, VAT report export
Reports Profit/loss, balance sheet, cash flow, trial balance, vehicle profitability
Auto accounting entries
Business event Debit Credit
Rental invoice generated Customer receivable Rental income + VAT payable
Payment received in cash Cash account Customer receivable
Payment received in bank Bank account Customer receivable
Deposit received Cash/bank Deposit liability
Deposit deducted for charges Deposit liability Customer receivable
Deposit refunded Deposit liability Cash/bank
Expense added Expense account + input VAT if
applicable
Cash/bank/supplier payable
Salik charged to customer Customer receivable Salik income/recovery + VAT if applicable
11. Corporate and Company Billing Workflow
Company/corporate clients are different from normal customers. They usually need credit limit, monthly statements,
multiple drivers, multiple vehicles, and consolidated invoices.
- Company is the billing account; driver is a separate authorized person.
- Corporate accounts can have branches, departments, cost centers, and approved vehicle categories.
- System must allow monthly invoicing by customer, branch, driver, vehicle, or contract group.
- Credit limit must block new agreements if overdue amount is above allowed limit unless manager approves.
- Corporate statement must show opening balance, all invoices, all payments, all deposits, all adjustments, and
closing balance.
12. Salik, Traffic Fine, and Toll/Fine Recovery
Salik and fines must never be manually guessed. The ERP should link the charge to the vehicle and then to the active
contract based on date/time.
Professional Car Rental ERP / CRM Plan Page 8
Process Workflow
Salik import Import file/API -> match plate/tag -> match active agreement by date/time -> assign to customer ->
invoice or add to final settlement
Fine import Import fine -> match plate -> match active agreement/driver -> assign liability -> add admin fee if
configured -> invoice customer
Unmatched entries Keep in unassigned queue with reason: no contract, date mismatch, plate mismatch, duplicate, sold
vehicle
Reports Pending Salik, invoiced Salik, unpaid Salik, fines by customer, fines by driver, fines by vehicle
13. Maintenance, Workshop, Damage, and Accident Module
Maintenance protects fleet value. Damage module protects company money. Both must be connected to vehicle
status and accounting.
Module Required features Connected to
Preventive maintenance Oil change, tire change, battery, brake, service due by KM/date Vehicle, expenses, alerts, workshop
status
Workshop job card Issue, assigned workshop, estimate, approval, invoice, photos Vehicle status and accounting
Damage case Damage photos, estimate, customer liability, deposit deduction,
repair invoice
Agreement, customer ledger, vehicle
status
Accident case Police report, insurance claim, repair, replacement car,
downtime cost
Insurance, customer, accounting,
reports
14. Branch, Staff, Tasks, and Internal Operations
For a real rental company, staff work must be controlled. Delivery, collection, inspections, payments, vehicle
movement, and branch transfers must be assigned and tracked.
Area Features
Branch management Branch vehicles, branch users, branch cash, branch reservations, branch reports, inter-branch
transfers
Staff profile Name, role, mobile, Emirates ID, license, department, branch, status, permissions
Task management Delivery task, collection task, inspection task, payment collection, vehicle transfer, maintenance
drop-off
Staff mobile app View assigned tasks, upload photos, collect signature, enter KM/fuel, collect payment, mark task
complete
Audit control Who created, who edited, who approved, who deleted, date/time/IP/device
15. Documents and Expiry Management
The ERP must behave like a document control system. It should know which documents are required by customer
type, driver type, vehicle type, company type, and branch policy.
Document group Examples Alert rules
Customer documents Emirates ID, passport, visa, license, IDP Alert before expiry; block rental when
expired if required.
Company documents Trade license, VAT certificate, authorization letter,
signatory ID
Alert before expiry; block credit if trade
license expired.
Vehicle documents Mulkiya, insurance, permit, finance, inspection Vehicle cannot rent if required vehicle
document expired.
Professional Car Rental ERP / CRM Plan Page 9
Document group Examples Alert rules
Staff documents Emirates ID, labor card, license, visa Staff cannot be assigned driving tasks if
license expired.
16. Notifications, WhatsApp, Email, and Automation
Trigger Notification
Reservation confirmed Send booking confirmation to customer and internal branch alert
Agreement started Send agreement PDF and payment receipt
Return due soon Send customer reminder and dashboard alert
Overdue return Send customer warning and manager alert
Payment overdue Send reminder to customer/corporate finance contact
Document expiry Notify staff before expiry and block after expiry if required
Maintenance due Notify maintenance manager and branch manager
Deposit pending refund Notify accountant and manager for approval
17. Reports and Analytics
Reports must not only show numbers. They must help the owner make decisions: which car earns money, which
customer owes money, which branch performs better, and where losses happen.
Report Purpose
Fleet utilization Shows which vehicles are earning and which are idle.
Vehicle profitability Rental income minus maintenance, insurance, repair, depreciation, downtime.
Customer statement Complete balance and transaction history per customer.
Corporate aging Shows unpaid corporate invoices by 0-30, 31-60, 61-90, 90+ days.
Revenue report Daily, weekly, monthly revenue by branch/category/staff/customer type.
VAT report Sales VAT, purchase VAT, VAT payable, export for filing.
Maintenance cost report Cost by vehicle, workshop, category, branch.
Damage recovery report Damage charged, collected, written off, deposit deducted.
Salik/fine report Imported, matched, invoiced, paid, unpaid, unassigned.
18. Settings, Master Data, and Admin Controls
- Company profile: name, logo, TRN, address, phone, email, invoice footer, agreement terms.
- Branch settings: branch name, address, users, cash account, vehicle inventory.
- Pricing settings: daily/weekly/monthly rates, seasonal rates, corporate rates, discount limits.
- Tax settings: VAT percentage, VAT treatment, invoice numbering, receipt numbering.
- Charge settings: late fee, extra KM fee, fuel charge, cleaning charge, damage admin fee, fine admin fee.
- Document rules: required documents by customer type, driver type, company type, vehicle type.
- Approval rules: discount approval, refund approval, credit override, document override, delete/cancel approval.
19. Security, Backup, and Audit Requirements
Professional Car Rental ERP / CRM Plan Page 10
Requirement Details
Login security Email/username login, strong password, optional 2FA, session timeout
Role permissions Control create, view, edit, delete, approve, export per module
Audit log Record every important action: create, update, delete, payment, refund, agreement close
Backups Automatic daily database backup, file backup, restore process
Data protection Encrypted passwords, secured uploads, private files, limited staff access
Deletion control Soft delete with restore; important financial records should not be permanently deleted by normal users
20. Full End-to-End Business Workflow
This is the complete professional flow that the ERP must support:
- 1. Add branch, users, roles, company settings, VAT, invoice numbering, and document rules.
- 2. Add vehicles with full documents, pricing, branch, Salik tag, GPS, insurance, registration, photos, and status.
- 3. Add customer account: resident, tourist, company, or corporate.
- 4. Add/approve driver based on customer type and required documents.
- 5. Create reservation by selecting dates, branch, vehicle, customer, driver, pricing, deposit, and extras.
- 6. Convert reservation to agreement after document/payment validation.
- 7. Complete handover inspection with KM, fuel, photos, accessories, payment, and signatures.
- 8. Vehicle status changes to rented; accounting, dashboard, customer ledger, and fleet calendar update
automatically.
- 9. During rental, system allows extension, payment, Salik, fines, damage notes, driver change, and vehicle
replacement.
- 10. At return, staff records KM, fuel, photos, damage, late time, missing items, Salik/fines, and final charges.
- 11. Final invoice is generated; deposit is refunded, partially used, fully used, or kept pending.
- 12. Agreement is closed; vehicle status becomes available, workshop, or damage depending inspection.
- 13. Accounting updates revenue, receivable, deposit liability, cash/bank, VAT, vehicle profitability, and branch
reports.
- 14. Owner dashboard and reports show exact business performance in real time.
21. Minimum Launch Version vs Full Enterprise Version
Version Must include
Minimum launch version Dashboard, vehicles, customers, drivers, reservations, agreements, payments, deposits, basic
invoices, basic reports, document expiry alerts
Professional version Accounting ledgers, VAT, Salik, fines, maintenance, damage, staff tasks, branch management,
WhatsApp/email, corporate billing
Enterprise version Customer portal, staff mobile app, GPS/API, OCR scanning, dynamic pricing, investor module,
approval workflows, advanced analytics
Professional Car Rental ERP / CRM Plan Page 11
Final Professional E