import pool from '../config/database.js';

class ReportsService {
  // ── VAT Report ────────────────────────────────────────────────────────────
  async getVatReport(tenantId, dateFrom, dateTo) {
    const from = dateFrom || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const to   = dateTo   || new Date().toISOString();

    const result = await pool.query(
      `SELECT
         COUNT(*)::int                                    AS invoice_count,
         COALESCE(SUM(sub_total),    0)::numeric          AS taxable_amount,
         COALESCE(SUM(vat_amount),   0)::numeric          AS vat_collected,
         COALESCE(SUM(total_amount), 0)::numeric          AS gross_total,
         COALESCE(SUM(amount_paid),  0)::numeric          AS amount_collected,
         COALESCE(SUM(balance_due),  0)::numeric          AS vat_outstanding
       FROM invoices
       WHERE tenant_id = $1
         AND status NOT IN ('DRAFT','VOID')
         AND created_at BETWEEN $2 AND $3`,
      [tenantId, from, to]
    );
    const r = result.rows[0];

    const monthly = await pool.query(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
         COALESCE(SUM(sub_total),   0)::numeric AS taxable_amount,
         COALESCE(SUM(vat_amount),  0)::numeric AS vat_amount,
         COALESCE(SUM(total_amount),0)::numeric AS gross_total,
         COUNT(*)::int                          AS invoice_count
       FROM invoices
       WHERE tenant_id = $1
         AND status NOT IN ('DRAFT','VOID')
         AND created_at BETWEEN $2 AND $3
       GROUP BY 1 ORDER BY 1`,
      [tenantId, from, to]
    );

    return {
      period: { from, to },
      summary: {
        invoice_count:    r.invoice_count,
        taxable_amount:   parseFloat(r.taxable_amount),
        vat_collected:    parseFloat(r.vat_collected),
        gross_total:      parseFloat(r.gross_total),
        amount_collected: parseFloat(r.amount_collected),
        vat_outstanding:  parseFloat(r.vat_outstanding),
        vat_rate:         5,
      },
      monthly_breakdown: monthly.rows.map(m => ({
        month:          m.month,
        taxable_amount: parseFloat(m.taxable_amount),
        vat_amount:     parseFloat(m.vat_amount),
        gross_total:    parseFloat(m.gross_total),
        invoice_count:  m.invoice_count,
      })),
    };
  }

  // ── Customer Statement ────────────────────────────────────────────────────
  async getCustomerStatement(tenantId, customerId, dateFrom, dateTo) {
    const from = dateFrom || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const to   = dateTo   || new Date().toISOString();

    const customer = await pool.query(
      `SELECT id, full_name_en, phone_number, email, customer_type FROM customers WHERE id = $1 AND tenant_id = $2`,
      [customerId, tenantId]
    );
    if (!customer.rows[0]) {
      const e = new Error('Customer not found'); e.statusCode = 404; throw e;
    }

    const invoices = await pool.query(
      `SELECT id, invoice_number, total_amount, amount_paid, balance_due, vat_amount, status, created_at, due_date
       FROM invoices
       WHERE tenant_id = $1 AND customer_id = $2 AND created_at BETWEEN $3 AND $4
       ORDER BY created_at`,
      [tenantId, customerId, from, to]
    );

    const payments = await pool.query(
      `SELECT p.id, p.payment_number, p.amount, p.payment_method, p.payment_date, i.invoice_number
       FROM payments p
       LEFT JOIN invoices i ON i.id = p.invoice_id
       WHERE p.tenant_id = $1 AND p.customer_id = $2 AND p.payment_date BETWEEN $3 AND $4
       ORDER BY p.payment_date`,
      [tenantId, customerId, from, to]
    );

    const totalBilled   = invoices.rows.reduce((s, r) => s + parseFloat(r.total_amount || 0), 0);
    const totalPaid     = payments.rows.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    const totalBalance  = invoices.rows.reduce((s, r) => s + parseFloat(r.balance_due || 0), 0);

    return {
      customer:  customer.rows[0],
      period:    { from, to },
      summary:   { total_billed: totalBilled, total_paid: totalPaid, balance_due: totalBalance },
      invoices:  invoices.rows,
      payments:  payments.rows,
    };
  }

  // ── Revenue Report ────────────────────────────────────────────────────────
  async getRevenueReport(tenantId, dateFrom, dateTo, groupBy = 'month') {
    const from = dateFrom || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const to   = dateTo   || new Date().toISOString();

    const trunc = groupBy === 'day' ? 'day' : groupBy === 'week' ? 'week' : 'month';

    const result = await pool.query(
      `SELECT
         TO_CHAR(DATE_TRUNC($4, ra.checkout_timestamp), 'YYYY-MM-DD') AS period,
         COUNT(ra.id)::int                                              AS agreements,
         COALESCE(SUM(ra.actual_amount), 0)::numeric                   AS rental_revenue,
         COALESCE(SUM(agc_totals.charges), 0)::numeric                 AS extra_charges
       FROM rental_agreements ra
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(amount),0) as charges
         FROM auto_generated_charges
         WHERE agreement_id = ra.id AND approval_status IN ('AUTO_APPROVED','APPROVED')
       ) agc_totals ON TRUE
       WHERE ra.tenant_id = $1 AND ra.status = 'CLOSED'
         AND ra.checkout_timestamp BETWEEN $2 AND $3
       GROUP BY 1 ORDER BY 1`,
      [tenantId, from, to, trunc]
    );

    const byCategory = await pool.query(
      `SELECT vc.category_name AS category, COUNT(ra.id)::int AS agreements,
              COALESCE(SUM(ra.actual_amount),0)::numeric AS revenue
       FROM rental_agreements ra
       JOIN vehicles v  ON v.id  = ra.vehicle_id
       JOIN vehicle_categories vc ON vc.id = v.category_id
       WHERE ra.tenant_id = $1 AND ra.status = 'CLOSED'
         AND ra.checkout_timestamp BETWEEN $2 AND $3
       GROUP BY vc.category_name ORDER BY revenue DESC`,
      [tenantId, from, to]
    );

    const totals = result.rows.reduce((s, r) => ({
      agreements:    s.agreements    + r.agreements,
      rental_revenue: s.rental_revenue + parseFloat(r.rental_revenue),
      extra_charges:  s.extra_charges  + parseFloat(r.extra_charges),
    }), { agreements: 0, rental_revenue: 0, extra_charges: 0 });

    return {
      period: { from, to, group_by: groupBy },
      totals: { ...totals, grand_total: totals.rental_revenue + totals.extra_charges },
      by_period:   result.rows.map(r => ({
        period:         r.period,
        agreements:     r.agreements,
        rental_revenue: parseFloat(r.rental_revenue),
        extra_charges:  parseFloat(r.extra_charges),
        total:          parseFloat(r.rental_revenue) + parseFloat(r.extra_charges),
      })),
      by_category: byCategory.rows.map(r => ({
        category:   r.category,
        agreements: r.agreements,
        revenue:    parseFloat(r.revenue),
      })),
    };
  }

  // ── Fleet Utilization ─────────────────────────────────────────────────────
  async getFleetUtilizationReport(tenantId, dateFrom, dateTo) {
    const from = dateFrom || new Date(Date.now() - 30 * 86400000).toISOString();
    const to   = dateTo   || new Date().toISOString();
    const totalDays = Math.max(1, Math.ceil((new Date(to) - new Date(from)) / 86400000));

    const result = await pool.query(
      `SELECT
         v.id, v.plate_number, v.make, v.model, v.year, v.status,
         vc.category_name AS category,
         COUNT(ra.id)::int AS rental_count,
         COALESCE(SUM(
           LEAST(EXTRACT(EPOCH FROM
             LEAST(ra.return_timestamp, $3::timestamptz)
             - GREATEST(ra.checkout_timestamp, $2::timestamptz)
           ) / 86400, $4)
         ), 0)::numeric AS rented_days,
         COALESCE(SUM(ra.actual_amount), 0)::numeric AS revenue
       FROM vehicles v
       LEFT JOIN vehicle_categories vc ON vc.id = v.category_id
       LEFT JOIN rental_agreements ra ON ra.vehicle_id = v.id
         AND ra.status IN ('ACTIVE','CLOSED')
         AND ra.checkout_timestamp < $3 AND (ra.return_timestamp IS NULL OR ra.return_timestamp > $2)
       WHERE v.tenant_id = $1 AND v.status != 'OUT_OF_SERVICE'
       GROUP BY v.id, v.plate_number, v.make, v.model, v.year, v.status, vc.category_name
       ORDER BY rented_days DESC`,
      [tenantId, from, to, totalDays]
    );

    const vehicles = result.rows.map(v => {
      const rentedDays = parseFloat(v.rented_days || 0);
      return {
        vehicle_id:       v.id,
        plate_number:     v.plate_number,
        make:             v.make,
        model:            v.model,
        year:             v.year,
        category:         v.category,
        rental_count:     v.rental_count,
        rented_days:      parseFloat(rentedDays.toFixed(1)),
        idle_days:        parseFloat((totalDays - rentedDays).toFixed(1)),
        utilization_pct:  parseFloat(((rentedDays / totalDays) * 100).toFixed(1)),
        revenue:          parseFloat(v.revenue),
      };
    });

    const totalVehicles      = vehicles.length;
    const avgUtilization     = totalVehicles > 0 ? vehicles.reduce((s, v) => s + v.utilization_pct, 0) / totalVehicles : 0;

    return {
      period: { from, to, total_days: totalDays },
      summary: {
        total_vehicles:      totalVehicles,
        avg_utilization_pct: parseFloat(avgUtilization.toFixed(1)),
        fully_idle_vehicles: vehicles.filter(v => v.rented_days === 0).length,
        high_utilization:    vehicles.filter(v => v.utilization_pct >= 70).length,
      },
      vehicles,
    };
  }

  // ── Vehicle Profitability ─────────────────────────────────────────────────
  async getVehicleProfitabilityReport(tenantId, dateFrom, dateTo) {
    const from = dateFrom || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const to   = dateTo   || new Date().toISOString();

    const result = await pool.query(
      `SELECT
         v.id, v.plate_number, v.make, v.model, v.year,
         vc.category_name AS category,
         COALESCE(SUM(ra.actual_amount), 0)::numeric       AS rental_revenue,
         COUNT(ra.id)::int                                  AS rental_count,
         COALESCE(SUM(wo.actual_cost), 0)::numeric          AS maintenance_cost,
         COUNT(DISTINCT wo.id)::int                         AS work_order_count
       FROM vehicles v
       LEFT JOIN vehicle_categories vc ON vc.id = v.category_id
       LEFT JOIN rental_agreements ra ON ra.vehicle_id = v.id AND ra.status = 'CLOSED'
         AND ra.return_timestamp BETWEEN $2 AND $3
       LEFT JOIN work_orders wo ON wo.vehicle_id = v.id AND wo.status = 'completed'
         AND wo.completed_at BETWEEN $2 AND $3
       WHERE v.tenant_id = $1
       GROUP BY v.id, v.plate_number, v.make, v.model, v.year, vc.category_name
       ORDER BY rental_revenue DESC`,
      [tenantId, from, to]
    );

    const vehicles = result.rows.map(v => {
      const revenue = parseFloat(v.rental_revenue);
      const cost    = parseFloat(v.maintenance_cost);
      return {
        vehicle_id:        v.id,
        plate_number:      v.plate_number,
        make:              v.make,
        model:             v.model,
        year:              v.year,
        category:          v.category,
        rental_revenue:    revenue,
        rental_count:      v.rental_count,
        maintenance_cost:  cost,
        work_order_count:  v.work_order_count,
        gross_profit:      parseFloat((revenue - cost).toFixed(2)),
        margin_pct:        revenue > 0 ? parseFloat((((revenue - cost) / revenue) * 100).toFixed(1)) : 0,
      };
    });

    return {
      period: { from, to },
      summary: {
        total_vehicles:   vehicles.length,
        total_revenue:    vehicles.reduce((s, v) => s + v.rental_revenue, 0),
        total_cost:       vehicles.reduce((s, v) => s + v.maintenance_cost, 0),
        total_profit:     vehicles.reduce((s, v) => s + v.gross_profit, 0),
        profitable_count: vehicles.filter(v => v.gross_profit > 0).length,
      },
      vehicles,
    };
  }

  // ── Maintenance Cost Report ───────────────────────────────────────────────
  async getMaintenanceCostReport(tenantId, dateFrom, dateTo) {
    const from = dateFrom || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const to   = dateTo   || new Date().toISOString();

    const summary = await pool.query(
      `SELECT
         COUNT(*)::int                                AS total_work_orders,
         COUNT(*) FILTER (WHERE status='completed')::int AS completed,
         COALESCE(SUM(estimated_cost),0)::numeric    AS total_estimated,
         COALESCE(SUM(actual_cost),   0)::numeric    AS total_actual,
         COALESCE(SUM(downtime_days), 0)::int        AS total_downtime_days
       FROM work_orders
       WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3`,
      [tenantId, from, to]
    );

    const byVehicle = await pool.query(
      `SELECT
         v.plate_number, v.make, v.model,
         COUNT(wo.id)::int                           AS work_orders,
         COALESCE(SUM(wo.actual_cost),0)::numeric    AS total_cost,
         COALESCE(SUM(wo.downtime_days),0)::int      AS downtime_days
       FROM work_orders wo
       JOIN vehicles v ON v.id = wo.vehicle_id
       WHERE wo.tenant_id = $1 AND wo.created_at BETWEEN $2 AND $3
       GROUP BY v.plate_number, v.make, v.model
       ORDER BY total_cost DESC`,
      [tenantId, from, to]
    );

    const byType = await pool.query(
      `SELECT type, COUNT(*)::int AS count,
              COALESCE(SUM(actual_cost),0)::numeric AS total_cost
       FROM work_orders
       WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3
       GROUP BY type ORDER BY total_cost DESC`,
      [tenantId, from, to]
    );

    const s = summary.rows[0];
    return {
      period:  { from, to },
      summary: {
        total_work_orders: s.total_work_orders,
        completed:         s.completed,
        total_estimated:   parseFloat(s.total_estimated),
        total_actual:      parseFloat(s.total_actual),
        total_downtime_days: s.total_downtime_days,
        cost_variance:     parseFloat((parseFloat(s.total_actual) - parseFloat(s.total_estimated)).toFixed(2)),
      },
      by_vehicle: byVehicle.rows.map(r => ({
        plate_number:  r.plate_number,
        make:          r.make,
        model:         r.model,
        work_orders:   r.work_orders,
        total_cost:    parseFloat(r.total_cost),
        downtime_days: r.downtime_days,
      })),
      by_type: byType.rows.map(r => ({
        type:       r.type,
        count:      r.count,
        total_cost: parseFloat(r.total_cost),
      })),
    };
  }

  // ── Damage Recovery Report ────────────────────────────────────────────────
  async getDamageRecoveryReport(tenantId, dateFrom, dateTo) {
    const from = dateFrom || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const to   = dateTo   || new Date().toISOString();

    const result = await pool.query(
      `SELECT
         COUNT(*)::int                                                      AS total_charges,
         COUNT(*) FILTER (WHERE approval_status = 'APPROVED')::int         AS approved,
         COUNT(*) FILTER (WHERE approval_status = 'PENDING')::int          AS pending,
         COUNT(*) FILTER (WHERE approval_status = 'REJECTED')::int         AS rejected,
         COALESCE(SUM(amount),0)::numeric                                   AS total_amount,
         COALESCE(SUM(amount) FILTER (WHERE approval_status='APPROVED'),0)::numeric AS approved_amount
       FROM auto_generated_charges
       WHERE tenant_id = $1 AND charge_type = 'DAMAGE'
         AND created_at BETWEEN $2 AND $3`,
      [tenantId, from, to]
    );

    const details = await pool.query(
      `SELECT
         agc.id, agc.amount, agc.approval_status, agc.description, agc.created_at,
         ra.agreement_number, c.full_name_en AS customer_name,
         v.plate_number
       FROM auto_generated_charges agc
       JOIN rental_agreements ra ON ra.id = agc.agreement_id
       JOIN customers c  ON c.id  = ra.customer_id
       JOIN vehicles  v  ON v.id  = ra.vehicle_id
       WHERE agc.tenant_id = $1 AND agc.charge_type = 'DAMAGE'
         AND agc.created_at BETWEEN $2 AND $3
       ORDER BY agc.created_at DESC`,
      [tenantId, from, to]
    );

    const s = result.rows[0];
    return {
      period:  { from, to },
      summary: {
        total_charges:   s.total_charges,
        approved:        s.approved,
        pending:         s.pending,
        rejected:        s.rejected,
        total_amount:    parseFloat(s.total_amount),
        approved_amount: parseFloat(s.approved_amount),
        recovery_rate:   s.total_amount > 0
          ? parseFloat(((parseFloat(s.approved_amount) / parseFloat(s.total_amount)) * 100).toFixed(1))
          : 0,
      },
      charges: details.rows.map(r => ({
        id:               r.id,
        agreement_number: r.agreement_number,
        customer_name:    r.customer_name,
        plate_number:     r.plate_number,
        amount:           parseFloat(r.amount),
        status:           r.approval_status,
        description:      r.description,
        created_at:       r.created_at,
      })),
    };
  }

  // ── Salik / Fine Report ───────────────────────────────────────────────────
  async getSalikFineReport(tenantId, dateFrom, dateTo) {
    const from = dateFrom || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const to   = dateTo   || new Date().toISOString();

    const result = await pool.query(
      `SELECT
         type,
         attribution_status,
         COUNT(*)::int                           AS count,
         COALESCE(SUM(amount),         0)::numeric AS total_amount,
         COALESCE(SUM(admin_fee),      0)::numeric AS total_admin_fee,
         COALESCE(SUM(amount + COALESCE(admin_fee,0)), 0)::numeric AS total_recoverable
       FROM fine_toll_events
       WHERE tenant_id = $1 AND event_date BETWEEN $2::date AND $3::date
       GROUP BY type, attribution_status
       ORDER BY type, attribution_status`,
      [tenantId, from, to]
    );

    const summary = { salik: 0, fine: 0, total_amount: 0, total_admin_fee: 0, attributed: 0, unattributed: 0, invoiced: 0 };
    result.rows.forEach(r => {
      if (r.type === 'SALIK') summary.salik += r.count;
      else summary.fine += r.count;
      summary.total_amount    += parseFloat(r.total_amount);
      summary.total_admin_fee += parseFloat(r.total_admin_fee);
      if (r.attribution_status === 'ATTRIBUTED') summary.attributed    += r.count;
      else if (r.attribution_status === 'INVOICED') summary.invoiced    += r.count;
      else summary.unattributed += r.count;
    });

    return {
      period:  { from, to },
      summary: {
        ...summary,
        total_recoverable: summary.total_amount + summary.total_admin_fee,
      },
      breakdown: result.rows.map(r => ({
        type:               r.type,
        attribution_status: r.attribution_status,
        count:              r.count,
        total_amount:       parseFloat(r.total_amount),
        total_admin_fee:    parseFloat(r.total_admin_fee),
        total_recoverable:  parseFloat(r.total_recoverable),
      })),
    };
  }

  // ── P&L (Profit & Loss) ───────────────────────────────────────────────────
  async getProfitLoss(tenantId, dateFrom, dateTo) {
    const from = dateFrom || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const to   = dateTo   || new Date().toISOString();

    const [revenue, extras, expenses, maintenance] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(actual_amount),0)::numeric AS rental_revenue,
                COALESCE(SUM(vat_amount),0)::numeric    AS vat_collected,
                COUNT(*)::int                           AS rental_count
         FROM rental_agreements
         WHERE tenant_id=$1 AND status='CLOSED' AND return_timestamp BETWEEN $2 AND $3`,
        [tenantId, from, to]
      ),
      pool.query(
        `SELECT charge_type, COALESCE(SUM(amount),0)::numeric AS total
         FROM auto_generated_charges
         WHERE tenant_id=$1 AND approval_status IN ('AUTO_APPROVED','APPROVED')
           AND created_at BETWEEN $2 AND $3
         GROUP BY charge_type`,
        [tenantId, from, to]
      ),
      pool.query(
        `SELECT category, COALESCE(SUM(amount),0)::numeric AS total,
                COALESCE(SUM(vat_amount),0)::numeric AS vat_total
         FROM expenses
         WHERE tenant_id=$1 AND expense_date BETWEEN $2::date AND $3::date
         GROUP BY category`,
        [tenantId, from, to]
      ),
      pool.query(
        `SELECT COALESCE(SUM(actual_cost),0)::numeric AS total
         FROM work_orders WHERE tenant_id=$1 AND status='completed'
           AND completed_at BETWEEN $2 AND $3`,
        [tenantId, from, to]
      ),
    ]);

    const r = revenue.rows[0];
    const rentalRevenue = parseFloat(r.rental_revenue);
    const vatCollected  = parseFloat(r.vat_collected);

    const extrasByType = {};
    extras.rows.forEach(e => { extrasByType[e.charge_type] = parseFloat(e.total); });
    const totalExtras = Object.values(extrasByType).reduce((s, v) => s + v, 0);

    const expenseByCategory = {};
    let totalExpenses = 0, totalExpenseVat = 0;
    expenses.rows.forEach(e => {
      expenseByCategory[e.category] = parseFloat(e.total);
      totalExpenses += parseFloat(e.total);
      totalExpenseVat += parseFloat(e.vat_total);
    });
    const maintenanceCost = parseFloat(maintenance.rows[0].total);

    const grossRevenue = rentalRevenue + totalExtras;
    const totalCosts   = totalExpenses + maintenanceCost;
    const netProfit    = grossRevenue - totalCosts;

    return {
      period: { from, to },
      income: {
        rental_revenue:  rentalRevenue,
        extra_charges:   extrasByType,
        total_extras:    totalExtras,
        gross_revenue:   grossRevenue,
        vat_collected:   vatCollected,
      },
      expenses: {
        by_category:     expenseByCategory,
        total_expenses:  totalExpenses,
        vat_on_expenses: totalExpenseVat,
        maintenance_cost: maintenanceCost,
        total_costs:     totalCosts,
      },
      summary: {
        gross_revenue:  parseFloat(grossRevenue.toFixed(2)),
        total_costs:    parseFloat(totalCosts.toFixed(2)),
        net_profit:     parseFloat(netProfit.toFixed(2)),
        profit_margin:  grossRevenue > 0 ? parseFloat(((netProfit / grossRevenue) * 100).toFixed(1)) : 0,
        rental_count:   r.rental_count,
      },
    };
  }
}

export default new ReportsService();
