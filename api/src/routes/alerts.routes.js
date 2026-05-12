import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

router.get('/', async (req, res) => {
  const tenantId = req.tenantId;
  const withinDays = parseInt(req.query.within_days) || 30;

  try {
    const [vehicleDocs, customerDocs, overdueReturns, expiringLicenses] = await Promise.all([
      // Vehicle documents expiring soon or expired
      pool.query(
        `SELECT 'vehicle_doc' AS alert_type,
                v.plate_number, v.id AS vehicle_id,
                vd.document_type, vd.expiry_date,
                CASE WHEN vd.expiry_date < CURRENT_DATE THEN 'EXPIRED'
                     WHEN vd.expiry_date <= CURRENT_DATE + $2 * INTERVAL '1 day' THEN 'EXPIRING_SOON'
                END AS severity
         FROM vehicle_documents vd
         JOIN vehicles v ON v.id = vd.vehicle_id
         WHERE vd.tenant_id = $1
           AND vd.expiry_date IS NOT NULL
           AND vd.expiry_date <= CURRENT_DATE + $2 * INTERVAL '1 day'
         ORDER BY vd.expiry_date`,
        [tenantId, withinDays]
      ),

      // Customer documents expiring soon
      pool.query(
        `SELECT 'customer_doc' AS alert_type,
                c.full_name_en AS customer_name, c.id AS customer_id, c.phone_number,
                CASE
                  WHEN c.id_expiry_date IS NOT NULL AND c.id_expiry_date <= CURRENT_DATE + $2 * INTERVAL '1 day'
                    THEN 'Emirates ID'
                  WHEN c.license_expiry_date IS NOT NULL AND c.license_expiry_date <= CURRENT_DATE + $2 * INTERVAL '1 day'
                    THEN 'Driving License'
                  WHEN c.passport_expiry IS NOT NULL AND c.passport_expiry <= CURRENT_DATE + $2 * INTERVAL '1 day'
                    THEN 'Passport'
                END AS document_type,
                LEAST(
                  COALESCE(c.id_expiry_date, '9999-01-01'),
                  COALESCE(c.license_expiry_date, '9999-01-01'),
                  COALESCE(c.passport_expiry, '9999-01-01')
                ) AS expiry_date,
                CASE
                  WHEN LEAST(
                    COALESCE(c.id_expiry_date, '9999-01-01'),
                    COALESCE(c.license_expiry_date, '9999-01-01'),
                    COALESCE(c.passport_expiry, '9999-01-01')
                  ) < CURRENT_DATE THEN 'EXPIRED'
                  ELSE 'EXPIRING_SOON'
                END AS severity
         FROM customers c
         WHERE c.tenant_id = $1
           AND c.is_active = TRUE
           AND (
             (c.id_expiry_date IS NOT NULL AND c.id_expiry_date <= CURRENT_DATE + $2 * INTERVAL '1 day')
             OR (c.license_expiry_date IS NOT NULL AND c.license_expiry_date <= CURRENT_DATE + $2 * INTERVAL '1 day')
             OR (c.passport_expiry IS NOT NULL AND c.passport_expiry <= CURRENT_DATE + $2 * INTERVAL '1 day')
           )
         ORDER BY expiry_date`,
        [tenantId, withinDays]
      ),

      // Overdue returns
      pool.query(
        `SELECT 'overdue_return' AS alert_type,
                ra.agreement_number, ra.id AS agreement_id,
                c.full_name_en AS customer_name,
                v.plate_number,
                ra.rental_end_datetime AS expected_return,
                EXTRACT(EPOCH FROM (NOW() - ra.rental_end_datetime))/3600 AS hours_overdue
         FROM rental_agreements ra
         JOIN customers c ON c.id = ra.customer_id
         JOIN vehicles  v ON v.id = ra.vehicle_id
         WHERE ra.tenant_id = $1
           AND ra.status = 'ACTIVE'
           AND ra.rental_end_datetime < NOW()
         ORDER BY ra.rental_end_datetime`,
        [tenantId]
      ),

      // Expiring insurance / registration (from vehicles table fields)
      pool.query(
        `SELECT 'vehicle_expiry' AS alert_type,
                v.id AS vehicle_id, v.plate_number, v.make, v.model,
                CASE
                  WHEN v.insurance_expiry IS NOT NULL AND v.insurance_expiry <= CURRENT_DATE + ($2 * INTERVAL '1 day') THEN 'Insurance'
                  WHEN v.registration_expiry IS NOT NULL AND v.registration_expiry <= CURRENT_DATE + ($2 * INTERVAL '1 day') THEN 'Registration'
                END AS document_type,
                LEAST(
                  COALESCE(v.insurance_expiry, '9999-01-01'::date),
                  COALESCE(v.registration_expiry, '9999-01-01'::date)
                ) AS expiry_date,
                CASE
                  WHEN LEAST(
                    COALESCE(v.insurance_expiry, '9999-01-01'::date),
                    COALESCE(v.registration_expiry, '9999-01-01'::date)
                  ) < CURRENT_DATE THEN 'EXPIRED'
                  ELSE 'EXPIRING_SOON'
                END AS severity
         FROM vehicles v
         WHERE v.tenant_id = $1
           AND v.status != 'OUT_OF_SERVICE'
           AND (
             (v.insurance_expiry IS NOT NULL AND v.insurance_expiry <= CURRENT_DATE + ($2 * INTERVAL '1 day'))
             OR (v.registration_expiry IS NOT NULL AND v.registration_expiry <= CURRENT_DATE + ($2 * INTERVAL '1 day'))
           )
         ORDER BY expiry_date`,
        [tenantId, withinDays]
      ),
    ]);

    const summary = {
      vehicle_docs:     vehicleDocs.rows.length,
      customer_docs:    customerDocs.rows.length,
      overdue_returns:  overdueReturns.rows.length,
      vehicle_expiry:   expiringLicenses.rows.length,
      total:            vehicleDocs.rows.length + customerDocs.rows.length + overdueReturns.rows.length + expiringLicenses.rows.length,
      critical:         [
        ...vehicleDocs.rows,
        ...customerDocs.rows,
        ...expiringLicenses.rows,
      ].filter(r => r.severity === 'EXPIRED').length + overdueReturns.rows.length,
    };

    return res.json({
      success: true,
      data: {
        summary,
        vehicle_documents:  vehicleDocs.rows,
        customer_documents: customerDocs.rows,
        overdue_returns:    overdueReturns.rows.map(r => ({
          ...r,
          hours_overdue: parseFloat(parseFloat(r.hours_overdue).toFixed(1)),
        })),
        vehicle_expiry:     expiringLicenses.rows,
      },
    });
  } catch (err) {
    console.error('Alerts error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

export default router;
