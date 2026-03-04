import InvoiceModel from '../models/invoice.model.js';
import PaymentModel from '../models/payment.model.js';
import pool from '../config/database.js';

const UAE_VAT_RATE = 0.05;

class InvoiceService {
  /**
   * Generate invoice for a closed agreement
   */
  async generateInvoice(agreementId, tenantId, userId) {
    // Check if invoice already exists
    const existing = await InvoiceModel.findByAgreementId(agreementId, tenantId);
    if (existing) {
      const error = new Error('Invoice already exists for this agreement');
      error.statusCode = 409;
      throw error;
    }

    // Get agreement
    const agQuery = 'SELECT * FROM rental_agreements WHERE id = $1 AND tenant_id = $2';
    const agResult = await pool.query(agQuery, [agreementId, tenantId]);
    const agreement = agResult.rows[0];

    if (!agreement) {
      const error = new Error('Agreement not found');
      error.statusCode = 404;
      throw error;
    }

    if (agreement.status !== 'CLOSED') {
      const error = new Error('Invoice can only be generated for closed agreements');
      error.statusCode = 400;
      throw error;
    }

    // Get auto-generated charges
    const chargesQuery = `
      SELECT * FROM auto_generated_charges
      WHERE agreement_id = $1 AND tenant_id = $2
      ORDER BY generated_at
    `;
    const chargesResult = await pool.query(chargesQuery, [agreementId, tenantId]);
    const charges = chargesResult.rows;

    // Build line items
    const lineItems = [];
    let lineNumber = 1;

    // Base rental fee
    lineItems.push({
      line_number: lineNumber++,
      description_en: 'Base Rental Fee',
      description_ar: 'رسوم الإيجار الأساسية',
      quantity: 1,
      unit_price: agreement.estimated_amount,
      amount: agreement.estimated_amount,
      charge_type: 'RENTAL_FEE',
    });

    // Add each charge as a line item
    const chargeLabels = {
      EXTRA_KM: { en: 'Extra Kilometer Charge', ar: 'رسوم الكيلومترات الإضافية' },
      FUEL: { en: 'Fuel Charge', ar: 'رسوم الوقود' },
      LATE_FEE: { en: 'Late Return Fee', ar: 'رسوم التأخير' },
      DAMAGE: { en: 'Damage Charge', ar: 'رسوم الأضرار' },
    };

    for (const charge of charges) {
      if (charge.amount > 0 && charge.approval_status !== 'REJECTED') {
        const labels = chargeLabels[charge.charge_type] || { en: charge.charge_type, ar: '' };
        lineItems.push({
          line_number: lineNumber++,
          description_en: labels.en,
          description_ar: labels.ar,
          quantity: 1,
          unit_price: charge.amount,
          amount: charge.amount,
          charge_id: charge.id,
          charge_type: charge.charge_type,
        });
      }
    }

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const vatAmount = Math.round(subtotal * UAE_VAT_RATE * 100) / 100;
    const totalAmount = Math.round((subtotal + vatAmount) * 100) / 100;

    // Generate invoice number
    const invoiceNumber = await InvoiceModel.generateInvoiceNumber(tenantId);

    // Due date: 30 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create invoice
    const invoice = await InvoiceModel.create({
      tenant_id: tenantId,
      invoice_number: invoiceNumber,
      agreement_id: agreementId,
      customer_id: agreement.customer_id,
      subtotal,
      vat_rate: UAE_VAT_RATE,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      balance_due: totalAmount,
      status: 'DRAFT',
      due_date: dueDate.toISOString().split('T')[0],
      created_by_user_id: userId,
    });

    // Create line items
    for (const item of lineItems) {
      await InvoiceModel.createLineItem({
        invoice_id: invoice.id,
        ...item,
      });
    }

    return InvoiceModel.getWithLineItems(invoice.id, tenantId);
  }

  /**
   * Issue an invoice (mark as ISSUED)
   */
  async issueInvoice(invoiceId, tenantId) {
    const invoice = await InvoiceModel.findById(invoiceId, tenantId);
    if (!invoice) {
      const error = new Error('Invoice not found');
      error.statusCode = 404;
      throw error;
    }

    if (invoice.status !== 'DRAFT') {
      const error = new Error(`Cannot issue invoice in ${invoice.status} status`);
      error.statusCode = 400;
      throw error;
    }

    const updated = await InvoiceModel.updateStatus(invoiceId, tenantId, 'ISSUED', {
      issued_at: new Date(),
    });

    // Notify customer
    try {
      const { default: NotificationService } = await import('./notification.service.js');
      await NotificationService.notifyInvoiceIssued(invoice.customer_id, tenantId, invoice.invoice_number, invoice.total_amount);
    } catch (err) {
      console.warn('Notification failed (invoice issued):', err.message);
    }

    return updated;
  }

  /**
   * Void an invoice (Constitution: never delete, only void)
   */
  async voidInvoice(invoiceId, tenantId, reason) {
    const invoice = await InvoiceModel.findById(invoiceId, tenantId);
    if (!invoice) {
      const error = new Error('Invoice not found');
      error.statusCode = 404;
      throw error;
    }

    if (invoice.status === 'VOIDED') {
      const error = new Error('Invoice is already voided');
      error.statusCode = 400;
      throw error;
    }

    if (invoice.status === 'PAID') {
      const error = new Error('Cannot void a fully paid invoice. Use credit note instead.');
      error.statusCode = 400;
      throw error;
    }

    return InvoiceModel.updateStatus(invoiceId, tenantId, 'VOIDED', {
      voided_at: new Date(),
      void_reason: reason,
    });
  }

  /**
   * Get invoice with line items
   */
  async getInvoice(invoiceId, tenantId) {
    const invoice = await InvoiceModel.getWithLineItems(invoiceId, tenantId);
    if (!invoice) {
      const error = new Error('Invoice not found');
      error.statusCode = 404;
      throw error;
    }
    return invoice;
  }

  /**
   * List invoices for a customer
   */
  async getCustomerInvoices(customerId, tenantId, filters = {}) {
    return InvoiceModel.list(tenantId, { ...filters, customer_id: customerId });
  }

  /**
   * Record a payment against an invoice
   */
  async recordPayment(invoiceId, tenantId, paymentData, userId) {
    const invoice = await InvoiceModel.findById(invoiceId, tenantId);
    if (!invoice) {
      const error = new Error('Invoice not found');
      error.statusCode = 404;
      throw error;
    }

    if (!['ISSUED', 'PARTIALLY_PAID'].includes(invoice.status)) {
      const error = new Error(`Cannot record payment for invoice in ${invoice.status} status`);
      error.statusCode = 400;
      throw error;
    }

    if (paymentData.amount > parseFloat(invoice.balance_due)) {
      const error = new Error(`Payment amount (${paymentData.amount}) exceeds balance due (${invoice.balance_due})`);
      error.statusCode = 400;
      throw error;
    }

    // Generate payment number
    const paymentNumber = await PaymentModel.generatePaymentNumber(tenantId);

    // Create payment record
    const payment = await PaymentModel.create({
      tenant_id: tenantId,
      payment_number: paymentNumber,
      invoice_id: invoiceId,
      customer_id: invoice.customer_id,
      amount: paymentData.amount,
      payment_method: paymentData.payment_method,
      payment_status: 'COMPLETED',
      transaction_reference: paymentData.transaction_reference,
      payment_date: paymentData.payment_date || new Date(),
      notes: paymentData.notes,
      received_by_user_id: userId,
    });

    // Update invoice
    const newAmountPaid = parseFloat(invoice.amount_paid) + paymentData.amount;
    const newBalanceDue = parseFloat(invoice.total_amount) - newAmountPaid;
    const newStatus = newBalanceDue <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    const updatedInvoice = await InvoiceModel.updateStatus(invoiceId, tenantId, newStatus, {
      amount_paid: newAmountPaid,
      balance_due: Math.max(0, newBalanceDue),
    });

    return { payment, invoice: updatedInvoice };
  }

  /**
   * Get payment history for a customer
   */
  async getCustomerPayments(customerId, tenantId, filters = {}) {
    return PaymentModel.listByCustomer(customerId, tenantId, filters);
  }
}

export default new InvoiceService();
