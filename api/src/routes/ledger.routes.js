import express from 'express';
import pool from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

// Customer Ledger — per-customer debit/credit running balance
router.get('/customer/:customerId', requireRole('OWNER_ADMIN', 'ACCOUNTS', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { customerId } = req.params;
    const { from, to } = req.query;
    const tenantId = req.tenantId;

    const customer = await pool.query(
      `SELECT id, full_name_en, phone_number, email, customer_type FROM customers WHERE id = $1 AND tenant_id = $2`,
      [customerId, tenantId]
    );
    if (!customer.rows[0]) return res.status(404).json({ error: 'Customer not found' });

    // Build unified transaction ledger
    const txns = await pool.query(
      `(
        -- Invoices = Debit (customer owes)
        SELECT
          i.created_at AS txn_date,
          'INVOICE'    AS txn_type,
          i.invoice_number AS reference,
          i.total_amount   AS debit,
          0                AS credit,
          i.status,
          'Invoice ' || i.invoice_number AS description
        FROM invoices i
        WHERE i.tenant_id = $1 AND i.customer_id = $2
          AND ($3::date IS NULL OR i.created_at::date >= $3::date)
          AND ($4::date IS NULL OR i.created_at::date <= $4::date)
      )
      UNION ALL
      (
        -- Payments = Credit (customer paid)
        SELECT
          p.payment_date  AS txn_date,
          'PAYMENT'       AS txn_type,
          p.payment_number AS reference,
          0               AS debit,
          p.amount        AS credit,
          p.payment_status AS status,
          'Payment via ' || p.payment_method AS description
        FROM payments p
        WHERE p.tenant_id = $1 AND p.customer_id = $2
          AND ($3::date IS NULL OR p.payment_date::date >= $3::date)
          AND ($4::date IS NULL OR p.payment_date::date <= $4::date)
      )
      UNION ALL
      (
        -- Deposits received = Credit
        SELECT
          d.created_at    AS txn_date,
          'DEPOSIT'       AS txn_type,
          d.deposit_number AS reference,
          0               AS debit,
          d.amount        AS credit,
          d.status,
          'Deposit received' AS description
        FROM deposits d
        WHERE d.tenant_id = $1 AND d.customer_id = $2
          AND d.status IN ('HELD','USED','FORFEITED','REFUNDED')
          AND ($3::date IS NULL OR d.created_at::date >= $3::date)
          AND ($4::date IS NULL OR d.created_at::date <= $4::date)
      )
      UNION ALL
      (
        -- Refunds = Credit
        SELECT
          rr.created_at   AS txn_date,
          'REFUND'        AS txn_type,
          rr.refund_number AS reference,
          0               AS debit,
          rr.amount       AS credit,
          rr.status,
          'Refund: ' || COALESCE(rr.reason,'') AS description
        FROM refund_requests rr
        WHERE rr.tenant_id = $1 AND rr.customer_id = $2
          AND rr.status IN ('APPROVED','PROCESSED')
          AND ($3::date IS NULL OR rr.created_at::date >= $3::date)
          AND ($4::date IS NULL OR rr.created_at::date <= $4::date)
      )
      ORDER BY txn_date ASC`,
      [tenantId, customerId, from || null, to || null]
    );

    // Running balance
    let running = 0;
    const rows = txns.rows.map(r => {
      const debit  = parseFloat(r.debit  || 0);
      const credit = parseFloat(r.credit || 0);
      running = running + debit - credit;
      return {
        txn_date:    r.txn_date,
        txn_type:    r.txn_type,
        reference:   r.reference,
        description: r.description,
        debit:       debit  > 0 ? debit  : null,
        credit:      credit > 0 ? credit : null,
        balance:     parseFloat(running.toFixed(2)),
        status:      r.status,
      };
    });

    const totalDebit  = rows.reduce((s, r) => s + (r.debit  || 0), 0);
    const totalCredit = rows.reduce((s, r) => s + (r.credit || 0), 0);

    return res.json({
      success: true,
      data: {
        customer:      customer.rows[0],
        period:        { from, to },
        summary:       {
          total_debit:  parseFloat(totalDebit.toFixed(2)),
          total_credit: parseFloat(totalCredit.toFixed(2)),
          closing_balance: parseFloat((totalDebit - totalCredit).toFixed(2)),
        },
        transactions: rows,
      },
    });
  } catch (err) {
    console.error('Customer ledger error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Corporate Statement
router.get('/corporate/:accountId', requireRole('OWNER_ADMIN', 'ACCOUNTS', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { accountId } = req.params;
    const { from, to } = req.query;
    const tenantId = req.tenantId;

    const account = await pool.query(
      `SELECT * FROM corporate_accounts WHERE id = $1 AND tenant_id = $2`,
      [accountId, tenantId]
    );
    if (!account.rows[0]) return res.status(404).json({ error: 'Corporate account not found' });

    // All customers under this corporate account
    const customers = await pool.query(
      `SELECT id FROM customers WHERE corporate_account_id = $1 AND tenant_id = $2`,
      [accountId, tenantId]
    );
    const customerIds = customers.rows.map(r => r.id);
    if (!customerIds.length) {
      return res.json({ success: true, data: { account: account.rows[0], summary: { total_billed: 0, total_paid: 0, balance_due: 0 }, invoices: [], payments: [] } });
    }

    const invoices = await pool.query(
      `SELECT i.*, c.full_name_en AS customer_name
       FROM invoices i JOIN customers c ON c.id = i.customer_id
       WHERE i.tenant_id = $1 AND i.customer_id = ANY($2)
         AND ($3::date IS NULL OR i.created_at::date >= $3::date)
         AND ($4::date IS NULL OR i.created_at::date <= $4::date)
         AND i.status != 'DRAFT'
       ORDER BY i.created_at DESC`,
      [tenantId, customerIds, from || null, to || null]
    );

    const payments = await pool.query(
      `SELECT p.*, c.full_name_en AS customer_name
       FROM payments p JOIN customers c ON c.id = p.customer_id
       WHERE p.tenant_id = $1 AND p.customer_id = ANY($2)
         AND ($3::date IS NULL OR p.payment_date::date >= $3::date)
         AND ($4::date IS NULL OR p.payment_date::date <= $4::date)
       ORDER BY p.payment_date DESC`,
      [tenantId, customerIds, from || null, to || null]
    );

    const totalBilled = invoices.rows.reduce((s, r) => s + parseFloat(r.total_amount || 0), 0);
    const totalPaid   = payments.rows.reduce((s, r) => s + parseFloat(r.amount || 0), 0);

    return res.json({
      success: true,
      data: {
        account:  account.rows[0],
        period:   { from, to },
        summary:  {
          total_billed:  parseFloat(totalBilled.toFixed(2)),
          total_paid:    parseFloat(totalPaid.toFixed(2)),
          balance_due:   parseFloat((totalBilled - totalPaid).toFixed(2)),
          credit_limit:  parseFloat(account.rows[0].credit_limit || 0),
          credit_used:   parseFloat(account.rows[0].credit_used || 0),
        },
        invoices:  invoices.rows,
        payments:  payments.rows,
      },
    });
  } catch (err) {
    console.error('Corporate statement error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
