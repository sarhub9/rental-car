import Joi from 'joi';

/**
 * Validation Utility
 * Joi schemas for request validation
 */

// Agreement creation schema
export const createAgreementSchema = Joi.object({
  customer_id: Joi.string().uuid().required(),
  vehicle_id: Joi.string().uuid().required(),
  rental_start_datetime: Joi.date().iso().required(),
  rental_end_datetime: Joi.date().iso().greater(Joi.ref('rental_start_datetime')).required(),
  daily_rate: Joi.number().positive().allow(null),
  weekly_rate: Joi.number().positive().allow(null),
}).or('daily_rate', 'weekly_rate');

// Agreement update schema
export const updateAgreementSchema = Joi.object({
  rental_start_datetime: Joi.date().iso(),
  rental_end_datetime: Joi.date().iso(),
  daily_rate: Joi.number().positive().allow(null),
  weekly_rate: Joi.number().positive().allow(null),
}).min(1);

// Checkout evidence schema
export const checkoutEvidenceSchema = Joi.object({
  odometer_reading: Joi.number().integer().min(0).max(9999999).required(),
  fuel_level: Joi.string().valid('EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTER', 'FULL').required(),
  accessories: Joi.array().items(Joi.string()).optional(),
  customer_otp_verified: Joi.boolean().optional(),
  gps_latitude: Joi.number().min(-90).max(90).required(),
  gps_longitude: Joi.number().min(-180).max(180).required(),
  gps_accuracy_meters: Joi.number().positive().optional(),
  captured_timestamp: Joi.date().iso().required(),
});

// Return evidence schema
export const returnEvidenceSchema = Joi.object({
  odometer_reading: Joi.number().integer().min(0).max(9999999).required(),
  fuel_level: Joi.string().valid('EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTER', 'FULL').required(),
  damage_documented: Joi.boolean().required(),
  damage_description: Joi.string().when('damage_documented', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  customer_acknowledgment: Joi.boolean().valid(true).required(),
  gps_latitude: Joi.number().min(-90).max(90).required(),
  gps_longitude: Joi.number().min(-180).max(180).required(),
  gps_accuracy_meters: Joi.number().positive().optional(),
  captured_timestamp: Joi.date().iso().required(),
});

// Customer creation schema
export const createCustomerSchema = Joi.object({
  full_name_en: Joi.string().max(200).required(),
  full_name_ar: Joi.string().max(200).allow(null, ''),
  phone_number: Joi.string().max(20).required(),
  whatsapp_number: Joi.string().max(20).allow(null, ''),
  email: Joi.string().email().max(200).allow(null, ''),
  nationality: Joi.string().max(100).allow(null, ''),
  date_of_birth: Joi.date().iso().allow(null),
  // UAE Resident docs
  emirates_id: Joi.string().max(20).allow(null, ''),
  id_expiry_date: Joi.date().iso().allow(null),
  driving_license_number: Joi.string().max(50).allow(null, ''),
  license_expiry_date: Joi.date().iso().allow(null),
  // Tourist docs
  passport_number: Joi.string().max(50).allow(null, ''),
  passport_expiry: Joi.date().iso().allow(null),
  visa_number: Joi.string().max(50).allow(null, ''),
  visa_expiry: Joi.date().iso().allow(null),
  hotel_name: Joi.string().max(200).allow(null, ''),
  hotel_address: Joi.string().max(300).allow(null, ''),
  arrival_date: Joi.date().iso().allow(null),
  departure_date: Joi.date().iso().allow(null),
  // Company / Corporate
  company_name: Joi.string().max(200).allow(null, ''),
  trade_license_number: Joi.string().max(100).allow(null, ''),
  trade_license_expiry: Joi.date().iso().allow(null),
  trn_number: Joi.string().max(50).allow(null, ''),
  authorized_person_name: Joi.string().max(200).allow(null, ''),
  authorized_person_mobile: Joi.string().max(20).allow(null, ''),
  payment_terms: Joi.string().valid('CASH', 'NET_30', 'NET_60', 'MONTHLY').default('CASH'),
  credit_limit: Joi.number().min(0).allow(null),
  // Address
  customer_type: Joi.string().valid('INDIVIDUAL', 'UAE_RESIDENT', 'TOURIST', 'COMPANY', 'CORPORATE').default('UAE_RESIDENT'),
  address_line_1: Joi.string().max(300).allow(null, ''),
  address_line_2: Joi.string().max(300).allow(null, ''),
  city: Joi.string().max(100).allow(null, ''),
  emirate: Joi.string().max(50).allow(null, ''),
});

// Customer update schema
export const updateCustomerSchema = Joi.object({
  full_name_en: Joi.string().max(200),
  full_name_ar: Joi.string().max(200).allow(null, ''),
  phone_number: Joi.string().max(20),
  whatsapp_number: Joi.string().max(20).allow(null, ''),
  email: Joi.string().email().max(200).allow(null, ''),
  nationality: Joi.string().max(100).allow(null, ''),
  date_of_birth: Joi.date().iso().allow(null),
  emirates_id: Joi.string().max(20).allow(null, ''),
  id_expiry_date: Joi.date().iso().allow(null),
  driving_license_number: Joi.string().max(50).allow(null, ''),
  license_expiry_date: Joi.date().iso().allow(null),
  passport_number: Joi.string().max(50).allow(null, ''),
  passport_expiry: Joi.date().iso().allow(null),
  visa_number: Joi.string().max(50).allow(null, ''),
  visa_expiry: Joi.date().iso().allow(null),
  hotel_name: Joi.string().max(200).allow(null, ''),
  hotel_address: Joi.string().max(300).allow(null, ''),
  arrival_date: Joi.date().iso().allow(null),
  departure_date: Joi.date().iso().allow(null),
  company_name: Joi.string().max(200).allow(null, ''),
  trade_license_number: Joi.string().max(100).allow(null, ''),
  trade_license_expiry: Joi.date().iso().allow(null),
  trn_number: Joi.string().max(50).allow(null, ''),
  authorized_person_name: Joi.string().max(200).allow(null, ''),
  authorized_person_mobile: Joi.string().max(20).allow(null, ''),
  payment_terms: Joi.string().valid('CASH', 'NET_30', 'NET_60', 'MONTHLY'),
  credit_limit: Joi.number().min(0).allow(null),
  customer_type: Joi.string().valid('INDIVIDUAL', 'UAE_RESIDENT', 'TOURIST', 'COMPANY', 'CORPORATE'),
  address_line_1: Joi.string().max(300).allow(null, ''),
  address_line_2: Joi.string().max(300).allow(null, ''),
  city: Joi.string().max(100).allow(null, ''),
  emirate: Joi.string().max(50).allow(null, ''),
  is_active: Joi.boolean(),
  is_blacklisted: Joi.boolean(),
  blacklist_reason: Joi.string().allow(null, ''),
  verification_status: Joi.string().valid('PENDING', 'VERIFIED', 'BLOCKED'),
}).min(1);

// Vehicle creation schema
export const createVehicleSchema = Joi.object({
  category_id: Joi.string().uuid().allow(null),
  make: Joi.string().max(100).required(),
  model: Joi.string().max(100).required(),
  year: Joi.number().integer().min(1990).max(2100).required(),
  color: Joi.string().max(50).allow(null, ''),
  plate_number: Joi.string().max(20).required(),
  plate_emirate: Joi.string().max(50).required(),
  chassis_number: Joi.string().max(50).allow(null, ''),
  transmission_type: Joi.string().valid('AUTOMATIC', 'MANUAL').default('AUTOMATIC'),
  fuel_type: Joi.string().valid('PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC').default('PETROL'),
  daily_rate: Joi.number().positive().allow(null),
  weekly_rate: Joi.number().positive().allow(null),
  current_odometer: Joi.number().integer().min(0).default(0),
  registration_expiry: Joi.date().iso().allow(null),
  insurance_expiry: Joi.date().iso().allow(null),
});

// Vehicle update schema
export const updateVehicleSchema = Joi.object({
  category_id: Joi.string().uuid().allow(null),
  make: Joi.string().max(100),
  model: Joi.string().max(100),
  year: Joi.number().integer().min(1990).max(2100),
  color: Joi.string().max(50).allow(null, ''),
  plate_number: Joi.string().max(20),
  plate_emirate: Joi.string().max(50),
  chassis_number: Joi.string().max(50).allow(null, ''),
  transmission_type: Joi.string().valid('AUTOMATIC', 'MANUAL'),
  fuel_type: Joi.string().valid('PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC'),
  status: Joi.string().valid('AVAILABLE', 'RENTED', 'MAINTENANCE', 'OUT_OF_SERVICE'),
  daily_rate: Joi.number().positive().allow(null),
  weekly_rate: Joi.number().positive().allow(null),
  current_odometer: Joi.number().integer().min(0),
  registration_expiry: Joi.date().iso().allow(null),
  insurance_expiry: Joi.date().iso().allow(null),
}).min(1);

// Photo metadata schema
export const photoMetadataSchema = Joi.object({
  photo_angle: Joi.string()
    .valid('FRONT', 'BACK', 'LEFT', 'RIGHT', 'INTERIOR', 'DASHBOARD', 'DAMAGE')
    .required(),
  gps_latitude: Joi.number().min(-90).max(90).required(),
  gps_longitude: Joi.number().min(-180).max(180).required(),
  gps_accuracy_meters: Joi.number().positive().optional(),
  captured_timestamp: Joi.date().iso().required(),
  device_info: Joi.object().optional(),
});

// ============================================================================
// Staff Auth Schemas
// ============================================================================
export const staffLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  tenant_id: Joi.string().uuid().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  new_password: Joi.string().min(8).max(128).required(),
});

// ============================================================================
// Admin User Management Schemas
// ============================================================================
export const createStaffUserSchema = Joi.object({
  full_name: Joi.string().max(200).required(),
  email: Joi.string().email().max(200).required(),
  phone_number: Joi.string().max(20).required(),
  role: Joi.string().valid(
    'OWNER_ADMIN', 'FRONT_DESK', 'FLEET_MANAGER', 'ACCOUNTS', 'DRIVER_RECOVERY'
  ).required(),
  password: Joi.string().min(8).max(128).required(),
});

export const updateStaffUserSchema = Joi.object({
  full_name: Joi.string().max(200),
  email: Joi.string().email().max(200),
  phone_number: Joi.string().max(20),
  role: Joi.string().valid(
    'OWNER_ADMIN', 'FRONT_DESK', 'FLEET_MANAGER', 'ACCOUNTS', 'DRIVER_RECOVERY'
  ),
}).min(1);

// ============================================================================
// Feature Request Schemas
// ============================================================================
export const featureRequestSchema = Joi.object({
  feature_title: Joi.string().max(200).required(),
  message: Joi.string().max(2000).required(),
  company_name: Joi.string().max(200),
  contact_email: Joi.string().email().max(200),
});

// ============================================================================
// Admin Settings Schema
// ============================================================================
export const updateSettingsSchema = Joi.object({
  km_allowance_per_day: Joi.number().integer().min(0),
  rate_per_extra_km: Joi.number().positive(),
  fuel_refill_rate: Joi.number().positive(),
  late_fee_per_hour: Joi.number().positive(),
  grace_period_minutes: Joi.number().integer().min(0),
}).min(1);

// ============================================================================
// Driver Task Schemas
// ============================================================================
export const createTaskSchema = Joi.object({
  agreement_id: Joi.string().uuid().required(),
  vehicle_id: Joi.string().uuid().required(),
  customer_id: Joi.string().uuid().required(),
  assigned_driver_id: Joi.string().uuid().required(),
  task_type: Joi.string().valid('DELIVERY', 'PICKUP', 'RECOVERY').required(),
  priority: Joi.string().valid('NORMAL', 'URGENT', 'CRITICAL').default('NORMAL'),
  destination_address: Joi.string().required(),
  destination_latitude: Joi.number().min(-90).max(90).allow(null),
  destination_longitude: Joi.number().min(-180).max(180).allow(null),
  scheduled_at: Joi.date().iso().required(),
  admin_notes: Joi.string().allow(null, ''),
});

export const completeTaskSchema = Joi.object({
  customer_confirmation_type: Joi.string().valid('OTP', 'SIGNATURE').required(),
  otp_code: Joi.string().when('customer_confirmation_type', {
    is: 'OTP',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  condition_notes: Joi.string().allow(null, ''),
});

export const cancelTaskSchema = Joi.object({
  reason: Joi.string().required(),
});

export const locationBatchSchema = Joi.object({
  updates: Joi.array().items(
    Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      accuracy_meters: Joi.number().positive().allow(null),
      speed_kmh: Joi.number().min(0).allow(null),
      recorded_at: Joi.date().iso().required(),
    })
  ).min(1).max(50).required(),
});

export const recoveryAttemptSchema = Joi.object({
  attempt_type: Joi.string().valid('PHONE_CALL', 'SMS', 'VISIT').required(),
  outcome: Joi.string().valid(
    'NO_ANSWER', 'CUSTOMER_COOPERATIVE', 'CUSTOMER_UNCOOPERATIVE',
    'VEHICLE_FOUND', 'VEHICLE_NOT_FOUND'
  ).required(),
  notes: Joi.string().allow(null, ''),
});

export const damageRecordSchema = Joi.object({
  description: Joi.string().required(),
  severity: Joi.string().valid('MINOR', 'MODERATE', 'MAJOR').required(),
  vehicle_area: Joi.string().required(),
});

/**
 * Validate request body against schema
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Request validation failed',
        details: errors,
      });
    }

    req.validatedBody = value;
    next();
  };
};

// ===========================================================================
// Company Registration & Management Schemas
// ===========================================================================
export const companyRegisterSchema = Joi.object({
  name: Joi.string().max(200).required(),
  contact_email: Joi.string().email().max(200).required(),
  phone_number: Joi.string().max(20).required(),
  password: Joi.string().min(8).max(128).required(),
});

export const updateCompanySchema = Joi.object({
  name: Joi.string().max(200),
  contact_email: Joi.string().email().max(200),
  phone_number: Joi.string().max(20),
  address: Joi.string().max(500).allow(null, ''),
  logo_url: Joi.string().uri().allow(null, ''),
  trade_license_number: Joi.string().max(100).allow(null, ''),
}).min(1);

export const subscribeSchema = Joi.object({
  plan_id: Joi.string().uuid().required(),
});
