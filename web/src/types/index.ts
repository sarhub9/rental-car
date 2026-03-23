export type FuelLevel = 'EMPTY' | 'QUARTER' | 'HALF' | 'THREE_QUARTER' | 'FULL';
export type AgreementStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';
export type CustomerType = 'INDIVIDUAL' | 'CORPORATE';
export type VehicleStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
export type TransmissionType = 'AUTOMATIC' | 'MANUAL';
export type FuelType = 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC';
export type ChargeType = 'EXTRA_KM' | 'FUEL' | 'LATE_FEE' | 'DAMAGE';
export type ApprovalStatus = 'AUTO_APPROVED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
export type PhotoAngle = 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'INTERIOR' | 'DASHBOARD' | 'DAMAGE';
export type EvidenceType = 'CHECKOUT' | 'RETURN';
export type UserRole =
  | 'SUPER_ADMIN' | 'OWNER_ADMIN' | 'FRONT_DESK'
  | 'FLEET_MANAGER' | 'ACCOUNTS' | 'DRIVER_RECOVERY' | 'RENTAL_CUSTOMER';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'VOIDED' | 'OVERDUE';
export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type DisputeStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED';
export type MessageThreadStatus = 'OPEN' | 'CLOSED';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';
export type TaskType = 'DELIVERY' | 'PICKUP' | 'RECOVERY';
export type TaskStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'NORMAL' | 'URGENT' | 'CRITICAL';
export type DamageSeverity = 'MINOR' | 'MODERATE' | 'MAJOR';
export type RecoveryAttemptType = 'PHONE_CALL' | 'SMS' | 'VISIT';
export type RecoveryAttemptOutcome = 'NO_ANSWER' | 'CUSTOMER_COOPERATIVE' | 'CUSTOMER_UNCOOPERATIVE' | 'VEHICLE_FOUND' | 'VEHICLE_NOT_FOUND';
export type DepositStatus = 'HELD' | 'USED' | 'RELEASED' | 'FORFEITED' | 'REFUNDED';
export type TollFineType = 'salik' | 'traffic_fine' | 'parking_fine';
export type AttributionStatus = 'pending' | 'matched' | 'unmatched' | 'manual';
export type WorkOrderType = 'scheduled' | 'unscheduled' | 'recall' | 'inspection';
export type WorkOrderStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
}

// ============================================================================
// Domain Interfaces
// ============================================================================

export interface Customer {
  id: string;
  tenant_id: string;
  customer_number: string;
  full_name_en: string;
  full_name_ar?: string;
  phone_number: string;
  email?: string;
  emirates_id?: string;
  driving_license_number: string;
  license_expiry_date: string;
  customer_type: CustomerType;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  emirate?: string;
  is_active: boolean;
  is_blacklisted: boolean;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleCategory {
  id: string;
  tenant_id: string;
  category_name: string;
  category_code: string;
  daily_rate_default?: number;
  weekly_rate_default?: number;
}

export interface Vehicle {
  id: string;
  tenant_id: string;
  vehicle_number: string;
  category_id?: string;
  category_name?: string;
  category_code?: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  plate_number: string;
  plate_emirate: string;
  chassis_number?: string;
  transmission_type: TransmissionType;
  fuel_type: FuelType;
  status: VehicleStatus;
  daily_rate?: number;
  weekly_rate?: number;
  current_odometer: number;
  registration_expiry?: string;
  insurance_expiry?: string;
  created_at: string;
  updated_at: string;
  // Joined fields from API
  maintenance_records?: WorkOrder[];
  rental_agreements?: Agreement[];
}

export interface Agreement {
  id: string;
  tenant_id: string;
  agreement_number: string;
  customer_id: string;
  vehicle_id: string;
  rental_start_datetime: string;
  rental_end_datetime: string;
  daily_rate?: number;
  weekly_rate?: number;
  estimated_amount: number;
  actual_amount?: number;
  status: AgreementStatus;
  checkout_timestamp?: string;
  return_timestamp?: string;
  created_by_user_id: string;
  is_immutable: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields from API
  customer?: Customer;
  vehicle?: Vehicle;
  audit_log?: AuditLogEntry[];
}

export interface PhotoEvidence {
  id: string;
  agreement_id: string;
  evidence_type: EvidenceType;
  photo_angle: PhotoAngle;
  photo_url: string;
  photo_thumbnail_url?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  gps_accuracy_meters?: number;
  captured_timestamp: string;
}

export interface CheckoutEvidence {
  id: string;
  agreement_id: string;
  odometer_reading: number;
  fuel_level: FuelLevel;
  accessories?: string[];
  customer_signature_url?: string;
  customer_otp_verified: boolean;
  captured_at: string;
  photos?: PhotoEvidence[];
}

export interface ReturnEvidence {
  id: string;
  agreement_id: string;
  odometer_reading: number;
  fuel_level: FuelLevel;
  kilometers_driven: number;
  damage_documented: boolean;
  damage_description?: string;
  customer_acknowledgment: boolean;
  captured_at: string;
  photos?: PhotoEvidence[];
}

export interface Charge {
  id: string;
  agreement_id: string;
  charge_type: ChargeType;
  calculation_basis: Record<string, unknown>;
  amount: number;
  rule_reference: string;
  rule_version: string;
  approval_status: ApprovalStatus;
  generated_at: string;
}

export interface AuditLogEntry {
  id: string;
  agreement_id: string;
  event_type: string;
  event_description: string;
  old_status?: AgreementStatus;
  new_status?: AgreementStatus;
  user_id: string;
  event_timestamp: string;
  event_data?: Record<string, unknown>;
}

// ============================================================================
// Auth Types
// ============================================================================

export interface AuthUser {
  id: string;
  tenant_id: string;
  role: UserRole;
  customer_id?: string;
  full_name: string;
  phone_number: string;
  email?: string;
  profile_photo_url?: string;
  last_login_at?: string;
}

// ============================================================================
// Customer Portal Types
// ============================================================================

export interface DashboardData {
  active_rentals_count: number;
  total_rentals: number;
  pending_charges: number;
  recent_agreements: Agreement[];
  upcoming_returns: Agreement[];
}

export interface UserProfile {
  id: string;
  tenant_id: string;
  role: UserRole;
  phone_number: string;
  email?: string;
  full_name: string;
  profile_photo_url?: string;
  last_login_at?: string;
  customer: Customer | null;
}

// ============================================================================
// Invoice Types
// ============================================================================

export interface Invoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  agreement_id: string;
  customer_id: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  status: InvoiceStatus;
  issued_at?: string;
  due_date: string;
  line_items: InvoiceLineItem[];
  created_at: string;
  // Joined fields from API
  agreement_number?: string;
  customer_name?: string;
  payments?: Payment[];
}

export interface InvoiceLineItem {
  id: string;
  line_number: number;
  description_en: string;
  description_ar?: string;
  description?: string;
  quantity: number;
  unit_price: number;
  amount: number;
  charge_type?: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  payment_number: string;
  invoice_id: string;
  customer_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_reference?: string;
  payment_date: string;
  created_at: string;
}

// ============================================================================
// Dispute Types
// ============================================================================

export interface Dispute {
  id: string;
  tenant_id: string;
  dispute_number: string;
  agreement_id: string;
  customer_id: string;
  charge_id?: string;
  invoice_id?: string;
  subject: string;
  description: string;
  status: DisputeStatus;
  messages: DisputeMessage[];
  created_at: string;
  updated_at: string;
}

export interface DisputeMessage {
  id: string;
  dispute_id: string;
  sender_user_id: string;
  sender_role: string;
  message: string;
  attachments?: string[];
  created_at: string;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

// ============================================================================
// Message Types
// ============================================================================

export interface MessageThread {
  id: string;
  tenant_id: string;
  customer_id: string;
  subject: string;
  status: MessageThreadStatus;
  last_message_at?: string;
  unread_count?: number;
  messages?: Message[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_user_id: string;
  sender_role: string;
  sender_name?: string;
  message_text: string;
  attachments?: string[];
  is_read: boolean;
  created_at: string;
}

// ============================================================================
// Owner/Admin Types
// ============================================================================

export interface StaffUser {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: UserRole;
  status: UserStatus;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminDashboardData {
  active_agreements: number;
  total_revenue: number;
  fleet_utilization_percent: number;
  overdue_returns: number;
  recent_activity: Array<{
    id: string;
    event_type: string;
    event_description: string;
    user_id: string;
    event_timestamp: string;
  }>;
  monthly_trend: Array<{
    month: string;
    agreements: number;
    estimated_revenue: number;
  }>;
}

export interface FleetStats {
  by_status: Record<string, number>;
  total: number;
}

export interface RevenueReport {
  period: string;
  total_invoices: number;
  total_billed: number;
  total_collected: number;
  total_outstanding: number;
  total_vat: number;
  collection_rate: number;
}

export interface TenantSettings {
  id: string;
  tenant_id: string;
  km_allowance_per_day: number;
  rate_per_extra_km: number;
  fuel_refill_rate: number;
  late_fee_per_hour: number;
  grace_period_minutes: number;
  rule_version: string;
}

// ============================================================================
// Driver/Recovery Types
// ============================================================================

export interface VehicleTask {
  id: string;
  tenant_id: string;
  agreement_id: string;
  vehicle_id: string;
  customer_id: string;
  assigned_driver_id: string;
  task_type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  destination_address: string;
  destination_latitude?: number;
  destination_longitude?: number;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  odometer_reading?: number;
  fuel_level?: FuelLevel;
  condition_notes?: string;
  admin_notes?: string;
  customer_confirmation_type?: string;
  customer_confirmation_at?: string;
  signature_url?: string;
  is_immutable: boolean;
  // Joined fields
  plate_number?: string;
  make?: string;
  model?: string;
  color?: string;
  customer_name?: string;
  customer_phone?: string;
  agreement_number?: string;
  evidence_photos_count?: number;
  damages_count?: number;
  recovery_attempts_count?: number;
  created_at: string;
  updated_at: string;
}

export interface DriverDashboardStats {
  completed_today: number;
  pending: number;
  in_progress: number;
}

export interface DamageRecord {
  id: string;
  description: string;
  severity: DamageSeverity;
  vehicle_area: string;
  photos: Array<{ photo_url: string; thumbnail_url: string }>;
  created_at: string;
}

export interface RecoveryAttempt {
  id: string;
  attempt_type: RecoveryAttemptType;
  outcome: RecoveryAttemptOutcome;
  notes?: string;
  attempted_at: string;
}

export interface PerformanceSummary {
  today: number;
  this_week: number;
  this_month: number;
  by_type: {
    deliveries: number;
    pickups: number;
    recoveries: number;
  };
}

// ============================================================================
// Fleet Manager Types
// ============================================================================

export interface FleetDashboardData {
  total_vehicles: number;
  available: number;
  rented: number;
  maintenance: number;
  out_of_service: number;
  utilization_percent: number;
  expiring_registrations: Vehicle[];
  expiring_insurance: Vehicle[];
}

// ============================================================================
// Accounts Types
// ============================================================================

export interface AccountsDashboardData {
  total_invoiced: number;
  total_collected: number;
  total_outstanding: number;
  overdue_count: number;
  vat_collected: number;
  recent_payments: Payment[];
  invoice_status_counts: Record<string, number>;
}

// ============================================================================
// ERP Upgrade Types
// ============================================================================

export interface Deposit {
  id: string;
  tenant_id: string;
  agreement_id: string;
  customer_id: string;
  amount: number;
  status: DepositStatus;
  amount_used: number;
  amount_released: number;
  collected_at?: string;
  released_at?: string;
  policy_delay_days: number;
  release_eligible_at?: string;
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TollFineEvent {
  id: string;
  tenant_id: string;
  plate_number: string;
  event_type: TollFineType;
  event_timestamp: string;
  amount: number;
  location?: string;
  attribution_status: AttributionStatus;
  agreement_id?: string;
  matched_at?: string;
  import_batch_id?: string;
  created_at: string;
}

export interface WorkOrder {
  id: string;
  tenant_id: string;
  work_order_number: string;
  vehicle_id: string;
  type: WorkOrderType;
  description: string;
  estimated_cost?: number;
  actual_cost?: number;
  scheduled_date?: string;
  started_at?: string;
  completed_at?: string;
  status: WorkOrderStatus;
  downtime_days: number;
  next_maintenance_km?: number;
  next_maintenance_date?: string;
  created_at: string;
  updated_at: string;
}

export interface RatePlan {
  id: string;
  tenant_id: string;
  name: string;
  version: number;
  daily_rate?: number;
  weekly_rate?: number;
  monthly_rate?: number;
  included_km_per_day: number;
  extra_km_rate: number;
  fuel_policy: Record<string, unknown>;
  late_return_rules: Record<string, unknown>;
  deposit_amount: number;
  add_ons: unknown[];
  terms_text?: string;
  is_active: boolean;
  effective_from?: string;
  effective_to?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemAuditLogEntry {
  id: number;
  tenant_id: string;
  user_id: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  justification?: string;
  ip_address?: string;
  created_at: string;
}

export interface KpiResponse {
  fleet: {
    total_vehicles: number;
    utilization_percent: number;
    rented_days: number;
    idle_days: number;
    downtime_days: number;
  };
  revenue: {
    base_rental_revenue: number;
    total_revenue: number;
    closed_agreements: number;
    extra_km_revenue: number;
    late_fee_revenue: number;
    fuel_revenue: number;
    extras_total: number;
  };
  risk: {
    damage_frequency: number;
    overdue_return_count: number;
    overdue_return_rate: number;
  };
  profit: {
    total_revenue: number;
    total_cost: number;
    total_margin: number;
    vehicles: Array<{
      vehicle_id: string;
      vehicle_number: string;
      total_revenue: number;
      total_cost: number;
      margin: number;
    }>;
  };
}
