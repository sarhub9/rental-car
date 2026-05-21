# World-Class SaaS Car Rental ERP / CRM Design Brief

## Goal

Design a full professional car rental ERP/CRM SaaS system for a UAE-based car rental company. The system must manage everything from fleet, customers, bookings, rental agreements, payments, deposits, Salik/tolls, fines, damages, maintenance, accounting, reports, staff permissions, customer portal, driver/mobile workflow, and automation.

---

## Design Style

- Modern SaaS dashboard
- Clean, premium, colorful but professional
- Dark mode first, with light mode option
- Left sidebar navigation
- Top search bar
- Notification center
- Quick action button
- Cards, charts, tables, filters, status badges
- Mobile/tablet responsive
- Arabic/English ready, but primary language English
- Professional enough for multi-branch rental company

---

## Main Sidebar Modules

1. Dashboard
2. Reservations / Bookings
3. Rental Agreements
4. Fleet / Vehicles
5. Customers
6. Drivers
7. Payments
8. Deposits
9. Invoices
10. Salik / Tolls
11. Traffic Fines
12. Damages / Accidents
13. Maintenance
14. Insurance / Registration Expiry
15. Delivery & Collection
16. Staff / Users
17. Branches
18. Investors / Car Owners
19. Accounting
20. Reports
21. Customer Portal
22. Website Inventory
23. Notifications
24. Settings
25. Audit Logs

---

## 1. Dashboard Screen

Dashboard must show the full business health in one view.

### Top Cards

- Total fleet
- Available cars
- Rented cars
- Reserved cars
- Maintenance cars
- Accident/damage cars
- Overdue returns
- Today's pickups
- Today's returns
- Total revenue today
- Monthly revenue
- Pending payments
- Pending deposits
- Salik pending billing
- Fine pending billing
- Cars with expired registration
- Cars with expired insurance

### Charts

- Monthly revenue chart
- Fleet utilization chart
- Booking source chart
- Profit by car chart
- Top earning vehicles
- Most delayed customers
- Maintenance cost trend
- Outstanding balance aging

### Live Alerts

- Agreement ending today
- Agreement overdue
- Customer balance pending
- Deposit refund pending
- Vehicle registration expiring
- Insurance expiring
- Service due by KM
- Service due by date
- Salik/fine not assigned
- Car returned with extra KM
- Payment failed
- New website booking received

### Quick Actions

- Add reservation
- Add customer
- Add vehicle
- Create agreement
- Record payment
- Add Salik
- Add fine
- Add damage
- Generate invoice

### Dashboard Table: Current Active Rentals

Columns: Agreement No, Customer, Car, Plate No, Start Date, Return Date, Remaining Days, Balance, Deposit, Status, Action

---

## 2. Vehicle / Fleet Module

**Purpose:** Manage every car from purchase/onboarding until sale/removal.

### Fleet List Screen Columns

- Vehicle image
- Plate number
- Make
- Model
- Year
- Color
- VIN/chassis number
- Category
- Branch
- Current status
- Current KM
- Daily rate
- Monthly rate
- Owner/investor
- Insurance expiry
- Registration expiry
- Last service
- Next service due
- Current customer
- Profit/loss
- Action buttons

### Vehicle Statuses

- Available
- Reserved
- Rented
- Maintenance
- Accident
- Blocked
- Sold
- Inactive
- Inspection required
- Cleaning required

### Add Vehicle Form

**Section A: Basic Vehicle Info**
- Make, Model, Trim, Year, Plate number, Chassis/VIN, Engine number, Color, Fuel type, Transmission, Seating capacity, Doors
- Category: Economy, SUV, Luxury, Sports, Van, Bus, Pickup
- Branch
- Vehicle image upload
- Multiple gallery images

**Section B: Rental Pricing**
- Daily rental price
- Weekly rental price
- Monthly rental price
- Allowed KM per day
- Allowed KM per month
- Extra KM charge
- Fuel policy
- Minimum rental days
- Security deposit amount
- Delivery fee
- Pickup fee
- Late return hourly charge
- Grace period minutes/hours
- Salik charge policy
- Fine admin fee
- Damage admin fee

**Section C: Purchase / Ownership**
- Owned by company or investor
- Investor name
- Purchase price
- Purchase date
- Financing status
- Loan amount
- Monthly installment
- Depreciation method
- Expected resale value
- Ownership documents upload

**Section D: Documents**
- Mulkiya/registration document
- Registration expiry date
- Insurance policy document
- Insurance expiry date
- RTA inspection document
- Mortgage/loan document
- Permit document
- Other documents

**Section E: Maintenance Setup**
- Current KM
- Last service KM
- Next service KM
- Last service date
- Next service date
- Tyre change KM
- Oil change KM
- Battery warranty expiry
- Service reminder before KM
- Service reminder before days

**Section F: Telematics / GPS**
- GPS device installed: yes/no
- Device ID
- Provider name
- Live location URL/API
- Odometer sync enabled
- Geo-fence enabled
- Speed alert enabled
- Unauthorized movement alert enabled

### Vehicle Detail Page Tabs

1. Overview
2. Booking Calendar
3. Agreements
4. Payments
5. Salik
6. Fines
7. Maintenance
8. Damages
9. Documents
10. Expenses
11. Profit/Loss
12. GPS/Location
13. Activity Log

### Automation

- If vehicle is selected in reservation, system must check availability automatically.
- If car is rented, status becomes "Rented".
- If agreement is closed, status becomes "Inspection Required".
- After inspection complete, status becomes "Available".
- If registration/insurance expiry is near, system sends alert.
- If service KM reached, car becomes "Service Due".
- If car has major damage, status becomes "Blocked" or "Accident".
- If car is linked to investor, profit must auto-calculate.

---

## 3. Customer Module

**Purpose:** Store full customer profile, documents, balance, rental history, risk score, and verification.

### Customer List Screen Columns

- Customer photo
- Customer name
- Mobile
- Email
- Nationality
- Customer type
- Emirates ID/passport
- License status
- Total rentals
- Outstanding balance
- Deposit held
- Risk score
- Blacklist status
- Last rental
- Action

### Customer Types

1. UAE Resident
2. Tourist
3. Company
4. Corporate Account
5. Walk-in Customer
6. Website Customer
7. VIP Customer
8. Blacklisted Customer

### Add Customer Workflow

**Step 1:** Select customer type. System changes required documents based on customer type.

**For UAE Resident:**
- Full name, Mobile number, WhatsApp number, Email, Nationality
- Emirates ID number, Emirates ID front/back upload
- UAE driving license number, Driving license front/back upload
- License issue date, License expiry date
- Home address, Company/employer name
- Emergency contact, Secondary mobile, Preferred language

**For Tourist:**
- Full name, Mobile/WhatsApp, Email, Nationality
- Passport number, Passport copy upload, Visa copy upload, Entry stamp upload
- International driving permit upload if needed
- Home country driving license
- Hotel address in UAE, UAE local contact
- Return flight date (optional), Emergency contact

**For Company:**
- Company name, Trade license number, Trade license upload, TRN number
- Company address
- Authorized person name, Emirates ID, and license
- POA/authorization letter, Company stamp upload
- Billing email, Payment terms, Credit limit

**For Corporate:**
- Company name, Contract account number, Corporate agreement terms
- Monthly billing cycle, Credit limit
- Authorized drivers list, Approved vehicle categories
- LPO required yes/no
- Billing contact, Finance contact, TRN, VAT invoice details

### Customer Detail Page Tabs

1. Overview
2. Documents
3. Agreements
4. Reservations
5. Invoices
6. Payments
7. Deposits
8. Salik
9. Fines
10. Damages
11. Notes
12. Risk Score
13. Activity Log

### Customer Risk Score

System calculates customer score based on:
- Late returns
- Pending balance
- Damage history
- Fine history
- Deposit disputes
- Number of rentals
- Payment behavior
- Blacklist records
- Document expiry

### Customer Statuses

- New
- Verified
- Pending documents
- Active
- VIP
- High risk
- Blacklisted
- Blocked

### Automation

- System checks duplicate customer by mobile, Emirates ID, passport, license number, and email.
- If old customer selected, system shows outstanding balance before new booking.
- If documents expired, system blocks agreement creation.
- If customer is blacklisted, system shows red warning and blocks booking unless admin approves.
- If customer has unpaid invoice, system shows warning.
- If customer has deposit balance, system shows before agreement.
- Customer documents should be OCR-ready for future scanning.

---

## 4. Reservation / Booking Module

**Purpose:** Create bookings from office, phone, WhatsApp, website, customer app, or walk-in.

### Reservation List Columns

- Reservation number
- Customer
- Vehicle/category
- Pickup date/time
- Return date/time
- Pickup branch
- Return branch
- Booking source
- Total amount
- Advance paid
- Balance
- Status
- Action

### Booking Statuses

- Draft
- Pending confirmation
- Confirmed
- Advance paid
- Vehicle assigned
- Ready for pickup
- Converted to agreement
- Cancelled
- No show
- Completed

### Add Reservation Workflow

**Step 1: Select date/time**
- Pickup date/time, Return date/time, Pickup branch, Return branch

**Step 2: Select car or category**
System shows only available cars. Filters: Category, Make, Model, Price range, Seats, Transmission, Branch, Available now, Monthly rental.

When car selected, auto-fill: Daily rate, Monthly rate, Allowed KM, Extra KM rate, Deposit amount, Fuel policy, Current KM, Plate number, Insurance/registration status.

**Step 3: Select customer**
- Search old customer by name, phone, Emirates ID, passport, license number, email
- Add new customer directly
- Show customer balance, document expiry, blacklist/risk warning

**Step 4: Pricing**
- Rental days auto-calculate
- Daily/monthly price auto-calculate
- Discount, Coupon, Delivery fee, Pickup fee, Child seat
- Additional driver fee, Insurance upgrade
- VAT 5%, Security deposit, Advance payment, Balance due

**Step 5: Payment**
- Payment method: Cash, Card, Bank transfer, Online payment, Cheque, Wallet/credit
- Payment account: Office cash, Bank account, Card terminal, Online gateway
- Upload payment proof

**Step 6: Confirmation**
- Generate reservation confirmation
- Send WhatsApp message
- Send email
- Create calendar event
- Block vehicle availability

### Automation

- Vehicle cannot be double booked.
- If booking dates overlap, system blocks reservation.
- If advance payment required and not paid, status remains pending.
- If booking is confirmed, car status becomes reserved.
- Before pickup, system sends reminder to customer and staff.
- If customer no show, staff can mark "No Show".
- Cancelled booking can have cancellation charge.
- Reservation can convert into rental agreement with one click.

---

## 5. Rental Agreement Module

**Purpose:** Create legal rental contracts, vehicle handover, payments, deposits, e-signature, and final closing.

### Agreement List Columns

- Agreement number
- Customer
- Vehicle
- Plate
- Start date/time
- Expected return
- Actual return
- Rental amount
- Deposit
- Balance
- Agreement status
- Action

### Agreement Statuses

- Draft
- Active
- Extended
- Overdue
- Returned
- Inspection pending
- Closed
- Cancelled
- Dispute
- Legal case

### Create Agreement Workflow

**Step 1:** Convert from reservation or create direct agreement.

**Step 2: Customer Verification**
System checks: Required documents uploaded, License valid, Emirates ID/passport valid, Customer not blacklisted, Outstanding balance warning, Deposit required, Risk score.

**Step 3: Vehicle Verification**
System checks: Vehicle available, Not in maintenance, Insurance valid, Registration valid, Current KM available, Fuel level, No active agreement, No block status.

**Step 4: Rental Terms**
- Agreement number (auto-generated)
- Customer, Additional driver, Vehicle
- Pickup branch, Return branch
- Start date/time, Return date/time
- Rental type: daily, weekly, monthly, long-term
- Rate, Allowed KM, Extra KM charge, Fuel policy
- Late return charge, Deposit amount, Insurance type
- Salik/toll policy, Fine policy, Damage policy
- VAT, Discount, Total amount

**Step 5: Vehicle Condition Check-Out**
Staff must record: Current KM, Fuel level, Exterior/interior/tyre condition, Spare tyre, Tools, Registration card, Cleanliness, Existing scratches/dents, Windshield/lights/AC condition.
Photos: front, back, left, right, interior, dashboard KM, fuel, scratches. Video upload optional.

**Step 6: Payment & Deposit**
- Rental payment, Security deposit, Payment method, Payment account, Payment proof, Auto receipt generation.

**Step 7: Contract Preview**
System generates agreement PDF with: Company details, Customer details, Driver details, Vehicle details, Rental dates, Pricing, Deposit, Terms and conditions, Salik/fine/damage rules, Vehicle condition photos, Customer signature, Staff signature, Company stamp area.

**Step 8: E-Signature**
- Customer signs on tablet/mobile
- Staff signs
- Signature saved in agreement
- Signed PDF generated automatically

**Step 9: Activate Agreement**
- Vehicle status becomes rented
- Customer receives agreement by WhatsApp/email
- Payment receipt generated
- Calendar updated
- Active rental appears on dashboard

### Agreement Extension Workflow

- Open active agreement, click extend
- Select new return date
- System calculates extra days, adds VAT
- Checks customer balance, requests additional payment if needed
- Updates agreement status to extended, sends confirmation

### Agreement Closing / Return Workflow

**Step 1:** Select agreement

**Step 2:** Enter actual return date/time

**Step 3:** Enter return KM

**Step 4:** Enter fuel level

**Step 5:** Upload return photos

**Step 6:** System calculates: Extra days, Late return charge, Extra KM, Fuel shortage charge, Salik/toll pending, Fines pending, Damages, Cleaning fee, VAT, Final balance.

**Step 7: Vehicle Inspection**
- No damage: close agreement
- Damage found: create damage case
- Service needed: move car to maintenance
- Cleaning needed: mark cleaning required

**Step 8: Deposit Settlement**
System shows: Deposit collected, Deduct balance, Deduct fines, Deduct Salik, Deduct damage, Refund amount, Hold amount, Refund method.

**Step 9: Final Invoice**
- Generate final invoice and deposit refund receipt
- Send to customer
- Vehicle status becomes available or inspection/maintenance

### Automation

- Agreement number auto-generated.
- Active agreement auto-updates vehicle status.
- Overdue agreement alert if return date passed.
- Daily reminder for overdue cars.
- Extra KM calculated automatically.
- Late fee calculated automatically.
- Deposit settlement calculated automatically.
- Agreement cannot close until required return inspection completed.
- Final invoice auto-generated.

---

## 6. Salik / Toll Module

**Purpose:** Import tolls and assign them to correct vehicle, agreement, and customer.

### Salik List Columns

- Toll ID, Date/time, Plate number, Gate/location, Amount, VAT, Admin fee, Vehicle, Agreement, Customer, Billing status, Invoice status

### Salik Import Methods

- Manual entry
- CSV upload
- API integration (future)
- Bulk import

### Salik Matching Logic

System checks: Plate number, Toll date/time, Which agreement had that car at that time, then assigns toll to that customer automatically.

### Salik Statuses

- Unmatched
- Matched
- Billed
- Paid
- Disputed
- Company expense

### Automation

- When Salik uploaded, system auto-matches to active agreement.
- If no agreement found, mark unmatched.
- If matched, add to customer invoice.
- If agreement already closed, add to pending customer balance.
- Add VAT and admin fee based on settings.
- Send Salik breakdown to customer.

---

## 7. Traffic Fines Module

**Purpose:** Track and bill traffic fines to correct customer.

### Fine Fields

- Fine number, Plate number, Fine date/time, Fine location, Violation type, Fine amount, Black points, Impound days, Admin fee, VAT, Payment status, Customer charge status, Upload fine document

### Fine Matching Logic

System matches fine by: Plate number, Fine date/time, Active agreement during that time, Customer/driver assigned.

### Fine Statuses

- New
- Matched
- Unmatched
- Billed
- Paid by company
- Charged to customer
- Disputed
- Legal follow-up

### Automation

- Auto-assign fine to agreement if time matches.
- Alert staff for black points or impound.
- Auto-create customer invoice.
- Deduct from deposit if deposit available.
- If no deposit, add to customer outstanding balance.
- Send customer fine notice with proof.

---

## 8. Damage / Accident Module

**Purpose:** Record damage, accident, repair cost, insurance claim, customer charge, and vehicle downtime.

### Damage Case Fields

- Damage case number, Vehicle, Customer, Agreement, Date/time, Damage type, Location, Description, Photos before/after, Police report upload, Insurance claim number, Workshop, Estimated repair cost, Approved repair cost, Customer payable amount, Company payable amount, Deposit deduction, Status

### Damage Statuses

- Reported
- Under review
- Quotation pending
- Customer accepted
- Insurance claim
- In workshop
- Repaired
- Closed
- Disputed

### Automation

- If damage added, car status becomes damage/blocked.
- If linked to agreement, system can deduct from deposit.
- If repair cost entered, invoice customer if applicable.
- Add vehicle downtime cost.
- Add repair expense to vehicle profit/loss.
- After repair complete, car requires inspection before available.

---

## 9. Maintenance Module

**Purpose:** Manage preventive maintenance, service reminders, repair jobs, workshop invoices, parts, and cost.

### Maintenance List Columns

- Job number, Vehicle, Plate, Current KM, Maintenance type, Workshop, Start date, Expected finish, Cost, Status

### Maintenance Types

- Oil service, Tyres, Battery, Brake pads, AC repair, Engine repair, Gear repair, Accident repair, Detailing, Inspection, Registration renewal, Insurance renewal

### Maintenance Job Fields

- Vehicle, Current KM, Job type, Complaint, Workshop name, Estimated cost, Approved cost, Final cost, Start date, Finish date, Invoice upload, Before/after photos, Notes

### Automation

- Service due alert by KM/date.
- Vehicle status becomes maintenance during job.
- Vehicle cannot be booked during maintenance dates.
- Maintenance cost adds to vehicle expense.
- After job closed, update next service KM/date.
- If maintenance overdue, show dashboard alert.

---

## 10. Payment Module

**Purpose:** Track every payment, receipt, account, method, and customer balance.

### Payment Methods

- Cash, Card, Bank transfer, Online payment, Cheque, Deposit adjustment, Wallet/credit note

### Payment Accounts

- Office cash, Main bank, Card machine, Online gateway, Petty cash, Branch cash

### Payment Fields

- Payment number, Customer, Agreement, Invoice, Amount, VAT portion, Method, Account, Reference number, Payment date, Received by, Proof upload, Notes

### Automation

- When payment is received, invoice balance updates.
- Receipt PDF generated.
- Customer statement updates.
- Cash/bank account balance updates.
- If payment covers full invoice, invoice marked paid.
- If partial, invoice marked partially paid.
- If overpayment, customer credit balance created.

---

## 11. Deposit Module

**Purpose:** Control security deposits collected, held, deducted, refunded, and disputed.

### Deposit Fields

- Deposit number, Customer, Agreement, Vehicle, Amount collected, Payment method, Collected date, Held amount, Deducted amount, Refund amount, Refund method, Refund date, Status

### Deposit Statuses

- Collected
- Partially deducted
- Refund pending
- Refunded
- Held
- Disputed
- Converted to payment

### Deposit Settlement Screen

Shows: Deposit amount, Rental balance, Extra KM, Fuel charge, Salik, Fines, Damage, Cleaning, Late fee, Refund due.

### Automation

- Deposit collected during agreement.
- At closing, system calculates deductions.
- Refund amount auto-calculated.
- Refund receipt generated.
- If deposit not enough, remaining balance becomes customer outstanding.
- If extra deposit remains, refund or customer credit.

---

## 12. Invoice Module

### Invoice Types

- Rental invoice, Final invoice, Salik invoice, Fine invoice, Damage invoice, Maintenance charge invoice, Corporate monthly invoice, Credit note, Proforma invoice

### Invoice Fields

- Invoice number, Customer, Agreement, Invoice date, Due date, Line items, Subtotal, VAT 5%, Discount, Total, Paid, Balance, Status

### Invoice Statuses

- Draft
- Sent
- Partially paid
- Paid
- Overdue
- Cancelled
- Credit note issued

### Automation

- Invoice number auto-generated.
- VAT calculated automatically.
- Invoice PDF generated.
- Send by WhatsApp/email.
- Overdue invoices appear on dashboard.
- Customer balance updates automatically.

---

## 13. Accounting Module

**Purpose:** Full business financial control.

### Main Accounting Screens

1. Chart of accounts
2. Cash/bank accounts
3. Income
4. Expenses
5. Customer receivables
6. Supplier payables
7. VAT report
8. Profit/loss
9. Balance sheet
10. Vehicle-wise profitability
11. Branch-wise profitability
12. Investor profit
13. Cash flow
14. Petty cash
15. Bank reconciliation

### Income Categories

- Rental income, Salik income, Fine admin fee, Damage recovery, Delivery income, Extra KM income, Fuel charge income, Late fee income, Other income

### Expense Categories

- Vehicle purchase, Maintenance, Insurance, Registration, Staff salary, Office rent, Marketing, Fuel, Cleaning, GPS subscription, Bank charges, Software cost, Legal cost, Depreciation

### Automation

- Every invoice creates receivable.
- Every payment updates cash/bank.
- Every expense reduces profit.
- Vehicle profit/loss auto-calculates.
- VAT report auto-calculates output VAT and input VAT.
- Investor profit auto-calculates based on agreed sharing.

---

## 14. Investor / Car Owner Module

**Purpose:** Manage cars owned by third-party investors.

### Investor Fields

- Investor name, Mobile, Email, Emirates ID/passport, Bank details, Profit sharing type, Fixed monthly rent or percentage, Cars owned, Contract upload

### Investor Car Profit Screen

For each car: Rental income, Salik/fine admin income, Expenses, Maintenance, Insurance, Registration, Net profit, Investor share, Company share, Paid amount, Balance payable.

### Automation

- System calculates investor profit monthly.
- Expenses deducted based on settings.
- Investor statement generated.
- Payment to investor recorded.
- Investor portal optional.

---

## 15. Delivery & Collection Module

**Purpose:** Manage vehicle delivery/pickup by drivers.

### Delivery Task Fields

- Task number, Agreement/reservation, Customer, Vehicle, Pickup/drop-off location, Date/time, Assigned driver, Status, Customer contact, Notes

### Statuses

- Scheduled, Driver assigned, On the way, Delivered, Collected, Failed, Cancelled

### Driver Mobile Workflow

- View assigned tasks
- Navigate to location
- Upload car photos
- Record KM/fuel
- Customer signature
- Mark delivered/collected

### Automation

- When delivery assigned, driver gets notification.
- Customer gets driver details.
- Delivery fee added to invoice.
- Vehicle handover photos saved in agreement.

---

## 16. Staff / User Permission Module

### User Roles

- Super Admin, Admin, Manager, Accountant, Reservation Staff, Fleet Manager, Driver, Maintenance Staff, Sales Agent, Branch Manager, Investor View Only

### Permission Settings

- View module, Add, Edit, Delete, Approve, Export, Refund, Discount approval, Close agreement, Access financial reports, Manage settings

### Automation

- Staff actions saved in audit log.
- Sensitive actions require approval.
- Discounts above limit require manager approval.
- Refunds require accountant/admin approval.

---

## 17. Branch Module

**Purpose:** Support multi-branch rental company.

### Branch Fields

- Branch name, Address, Phone, Manager, Cash account, Vehicles assigned, Staff assigned

### Branch Logic

- Vehicles can be assigned to branch.
- Booking can start at one branch and return to another.
- Inter-branch transfer available.
- Branch-wise revenue and expenses.
- Staff can only see own branch if permission restricted.

---

## 18. Customer Portal / Website Booking

### Customer Portal Features

- Customer login
- View bookings
- Upload documents
- Sign agreement
- Pay invoice
- View Salik/fine breakdown
- Request extension
- Request support
- Download invoices
- View deposit status

### Website Booking Features

- Search available cars
- Filter by category/price/brand
- Select pickup/return date
- See real-time price
- Upload documents
- Pay advance
- Receive confirmation
- Booking enters CRM automatically

### Automation

- Website booking creates reservation.
- Customer documents sync to CRM.
- Online payment updates invoice.
- Staff receives new booking notification.

---

## 19. Notification System

### Notification Channels

- In-app, Email, WhatsApp, SMS (optional), Push notification for mobile app

### Notification Triggers

- Booking confirmation
- Payment received
- Agreement activated
- Return reminder
- Overdue return
- Invoice due
- Deposit refund
- Salik billed
- Fine billed
- Damage case opened
- Insurance expiry
- Registration expiry
- Service due
- Staff task assigned

---

## 20. Reports Module

### Reports

- Daily rental report
- Monthly revenue report
- Fleet utilization report
- Vehicle profit report
- Customer balance report
- Outstanding invoices
- Deposit report
- Salik report
- Fine report
- Maintenance cost report
- Damage report
- Staff performance
- Branch performance
- Investor profit report
- VAT report
- Cash/bank report
- Booking source report
- Occupancy/utilization report

### Each Report Needs

- Date filter, Branch filter, Vehicle filter, Customer filter
- Export PDF, Export Excel, Print option

---

## 21. Settings Module

### Company Profile

- Company name, Logo, Address, TRN, Phone, Email, Website, Terms and conditions

### Rental Settings

- Agreement numbering, Invoice numbering, Deposit rules, VAT percentage, Salik admin fee, Fine admin fee, Late return grace period, Extra KM rate default, Fuel charge settings, Damage charge settings, Cancellation policy

### Document Templates

- Rental agreement template
- Invoice template
- Receipt template
- Deposit receipt
- Final settlement
- Salik invoice
- Fine notice
- Damage notice
- Corporate invoice

### Automation Settings

- Auto invoice on agreement close
- Auto match Salik/fines
- Auto send reminders
- Auto block expired documents
- Auto mark overdue agreements
- Auto create service reminder

---

## 22. Audit Log

### Track Every Action

- User login
- Add/edit/delete customer
- Add/edit/delete vehicle
- Create agreement
- Close agreement
- Payment added
- Payment deleted
- Refund issued
- Discount applied
- Settings changed
- Document downloaded
- Report exported

### Audit Log Fields

- Date/time, User, Action, Module, Old value, New value, IP/device, Status

---

## 23. AI / Smart Automation Features

- AI document reading/OCR
- Auto-fill customer data from Emirates ID/passport/license
- Duplicate customer detection
- Smart risk score
- Dynamic pricing suggestions
- Predictive maintenance alerts
- Vehicle utilization suggestions
- Fraud warning
- Late return prediction
- Best car recommendation for booking
- Auto WhatsApp replies for booking status
- AI summary of customer history

---

## 24. Required Design Screens (Figma)

1. Login screen
2. Forgot password
3. Main dashboard
4. Fleet list
5. Add vehicle form
6. Vehicle detail page
7. Customer list
8. Add customer multi-step form
9. Customer detail page
10. Reservation list
11. Add reservation flow
12. Agreement list
13. Create agreement flow
14. Vehicle check-out inspection
15. E-signature screen
16. Agreement PDF preview screen
17. Agreement return/closing screen
18. Deposit settlement screen
19. Invoice list
20. Invoice detail/PDF preview
21. Payment entry screen
22. Salik import screen
23. Salik matching screen
24. Fine import/matching screen
25. Damage case screen
26. Maintenance job screen
27. Accounting dashboard
28. Reports dashboard
29. Staff/user permission screen
30. Branch management screen
31. Investor dashboard
32. Customer portal dashboard
33. Website booking car search page
34. Driver mobile delivery task screen
35. Notification center
36. Settings page
37. Audit log page

---

## 25. Important UX Rules

- Every table must have search, filters, export, column control, and bulk actions.
- Every important record must have timeline/activity history.
- Every form must support save draft.
- Required fields must be clearly marked.
- System must show warnings before risky actions.

### Color Badge System

| Color | Meaning |
|-------|---------|
| Green | Available / Paid / Active |
| Red | Overdue / Blocked / Unpaid |
| Orange | Pending / Warning |
| Blue | Confirmed / Info |
| Gray | Inactive / Draft |

### Key UX Principles

- Dashboard must be easy for owner to understand in 30 seconds.
- Staff should be able to create booking/agreement fast without confusion.
- Agreement closing must clearly show final calculation.
- Vehicle availability must be visual with calendar.
- Customer balance must always be visible before new rental.
- Mobile driver screens must be simple and fast.

---

## 26. Implementation Status (Compared with Codebase)

### Legend
- ✅ Fully Implemented
- ⚠️ Partially Implemented
- ❌ Not Implemented

---

### ✅ Fully Implemented (Web + API)

| # | Module | Web Pages | API Backend |
|---|---|---|---|
| 1 | Dashboard | `/dashboard` | `admin-dashboard` routes + service |
| 2 | Reservations / Bookings | `/reservations`, `/reservations/create`, `/reservations/[id]` | `reservation` routes/controller/service |
| 3 | Rental Agreements | `/agreements`, `/agreements/create`, `/agreements/[id]`, `/agreements/[id]/checkout`, `/agreements/[id]/return` | `agreement` routes/controller/service |
| 4 | Fleet / Vehicles | `/vehicles`, `/vehicles/create`, `/vehicles/[id]`, `/vehicles/[id]/edit` | `vehicle` routes/controller/service |
| 5 | Customers | `/customers`, `/customers/create` | `customer` routes/controller/service |
| 6 | Drivers | `/drivers`, `/drivers/create` | `driver-profile` routes/controller/service |
| 7 | Payments | `/accounts/payments` | `payment` routes/controller/service |
| 8 | Deposits | `/accounts/deposits` | `deposit` routes/controller/service |
| 9 | Invoices | `/invoices`, `/invoices/[id]` | `invoice` routes/controller/service |
| 10 | Salik / Tolls | `/accounts/toll-fines` | `toll-fine`, `toll-event` routes/controller/service |
| 11 | Traffic Fines | (same toll-fines page) | `toll-fine` module |
| 12 | Damages / Accidents | `/incidents`, `/incidents/create`, `/incidents/[id]` | `incident` routes/controller/service |
| 13 | Maintenance | `/maintenance`, `/maintenance/create`, `/maintenance/[id]` | `maintenance` + `work-order` routes/service |
| 14 | Insurance / Registration Expiry | `/alerts` + vehicle documents | `vehicle-document` routes, `alerts.routes.js` |
| 15 | Delivery & Collection | `/driver`, `/driver/tasks/[id]` | `driver-task` routes/controller/service |
| 16 | Staff / Users | `/staff`, `/staff/create`, `/admin/users`, `/admin/users/[id]` | `staff-auth`, `admin-user` routes |
| 17 | Branches | `/branches`, `/branches/create` | `branch` routes/controller/service |
| 18 | Reports | `/reports`, `/admin/reports` | `reports` routes/controller/service |
| 19 | Customer Portal | `/portal/*` (invoices, rentals, disputes, messages, notifications, profile) | `customer-portal` routes/controller/service |
| 20 | Notifications | `/portal/notifications` | `notification` model/controller/service |
| 21 | Settings | `/admin/settings` | `admin-settings` routes/controller |
| 22 | Audit Logs | `/admin/audit-logs` | `system-audit-log` routes + `audit-log.service.js` |
| 23 | Corporate Accounts | `/corporate-accounts`, `/corporate-accounts/[id]` | `corporate-account` routes/controller/service |
| 24 | Accounting / Ledger | `/ledger`, `/accounts/*` (cash-drawer, payments, deposits, refunds) | `ledger.routes.js`, `expense.routes.js`, `cash-drawer` |
| 25 | Expenses | `/expenses`, `/expenses/create` | `expense` model/service |
| 26 | Rate Plans | `/rate-plans`, `/rate-plans/create`, `/rate-plans/[id]` | `rate-plan` routes/controller/service |
| 27 | Messages | `/messages`, `/messages/[id]` | `message` routes/controller/service |

---

### ⚠️ Partially Implemented

| # | Module | What Exists | What Is Missing |
|---|---|---|---|
| 1 | Investors / Car Owners | `026_vehicle_ownership.sql` migration (DB only), vehicle owner field on vehicle | No `/investors` frontend page, no investor dashboard, no profit calculation screen, no investor statement generation |
| 2 | Customer Detail Page | `/customers` list + `/customers/create` | No `/customers/[id]` detail page with tabs: agreements, invoices, deposits, Salik, fines, risk score, activity log |
| 3 | Driver Detail Page | `/drivers` list + `/drivers/create` | No `/drivers/[id]` detail page |
| 4 | Full Accounting Module | `/ledger` + accounts pages | Missing: chart of accounts, VAT report, profit/loss statement, balance sheet, bank reconciliation, cash flow |
| 5 | Vehicle Detail Tabs | `/vehicles/[id]` exists | Tabs for booking calendar and GPS/location likely incomplete |
| 6 | Agreement Return / Closing | `/agreements/[id]/return` exists | Deposit settlement screen (step 8 of agreement closing workflow) may be incomplete |
| 7 | Salik / Fine Matching UI | `toll-attribution.service.js` exists in API | No dedicated UI screen for manual matching of unmatched tolls/fines to agreements |

---

### ❌ Not Implemented

| # | Feature | Requirement |
|---|---|---|
| 1 | Investors / Car Owners (full module) | `/investors` list, investor detail page, profit sharing setup, investor monthly statement, payment to investor recording |
| 2 | Website Inventory / Public Booking | Public-facing car search page, filter by category/price/brand, select dates, see real-time price, online payment, booking enters CRM automatically |
| 3 | E-Signature Screen | Customer signs on tablet/mobile during agreement creation — no e-signature component exists |
| 4 | Agreement PDF Generation | Signed PDF with company/customer/vehicle/condition photos, terms, signatures, company stamp area |
| 5 | WhatsApp Notifications | WhatsApp channel for booking confirmation, payment receipt, return reminder, overdue alert — only in-app notifications exist |
| 6 | AI / Smart Automation | OCR for Emirates ID/passport/license, auto-fill customer data, risk score calculation, dynamic pricing suggestions, fraud warning, late return prediction |
| 7 | Vehicle Booking Calendar | Visual availability calendar per vehicle on the vehicle detail page |
| 8 | Vehicle Check-out Inspection Form | Step 5 of agreement creation — condition photos (front/back/left/right/interior), scratch map, fuel level, existing damage recording |
| 9 | Document Templates in Settings | Rental agreement template, invoice template, receipt template, deposit receipt, final settlement, Salik invoice, fine notice, damage notice |
| 10 | Inter-Branch Vehicle Transfer | Branch module exists but no inter-branch transfer screen or workflow |
| 11 | Customer Risk Score Logic | No risk score calculation based on late returns, pending balance, damage history, fine history, payment behavior |
| 12 | Vehicle Profit / Loss Tab | Per-vehicle income/expense breakdown screen with rental income, maintenance costs, depreciation, net profit |
| 13 | Vehicle GPS / Telematics | GPS device setup in vehicle form, live location, geo-fence, speed alerts, odometer sync |
| 14 | SMS Notifications | SMS channel for notifications (optional per require.md but not wired up) |

---

### Summary

| Status | Count |
|---|---|
| ✅ Fully Implemented | 27 modules |
| ⚠️ Partially Implemented | 7 modules |
| ❌ Not Implemented | 14 features |

### Priority Order for Remaining Work

1. **Customer `/[id]` detail page** — referenced from agreements, invoices, everywhere
2. **Investor / Car Owner full module** — business critical for UAE car rental model
3. **E-Signature + Agreement PDF** — legal requirement
4. **Vehicle Check-out Inspection Form** — part of agreement creation workflow
5. **Salik / Fine matching UI** — service logic exists, needs frontend
6. **Customer Risk Score** — blocks blacklist/document expiry enforcement
7. **Website public booking page** — customer acquisition channel
8. **Full Accounting module** — VAT report, balance sheet, profit/loss
9. **Agreement PDF + Document Templates** — professional output
10. **WhatsApp Notifications** — standard UAE business communication channel
