import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@drivebx.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@drivebx.com';

class EmailService {
  async send({ to, subject, html, text }) {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('re_your')) {
      console.log(`[Email skipped - no API key] To: ${to} | Subject: ${subject}`);
      return { skipped: true };
    }
    try {
      const result = await resend.emails.send({ from: FROM_EMAIL, to, subject, html: html || `<p>${text}</p>` });
      return result;
    } catch (err) {
      console.error('Email send error:', err.message);
      return { error: err.message };
    }
  }

  // Reservation confirmed
  async sendReservationConfirmation({ customerEmail, customerName, agreementNumber, pickupDate, vehicle, totalEstimate }) {
    return this.send({
      to: customerEmail,
      subject: `Reservation Confirmed — ${agreementNumber}`,
      html: `
        <h2>Reservation Confirmed</h2>
        <p>Dear ${customerName},</p>
        <p>Your reservation has been confirmed.</p>
        <table>
          <tr><td><b>Reference:</b></td><td>${agreementNumber}</td></tr>
          <tr><td><b>Pickup Date:</b></td><td>${new Date(pickupDate).toLocaleDateString()}</td></tr>
          <tr><td><b>Vehicle:</b></td><td>${vehicle}</td></tr>
          <tr><td><b>Estimated Total:</b></td><td>AED ${totalEstimate}</td></tr>
        </table>
        <p>Thank you for choosing us.</p>
      `,
    });
  }

  // Agreement started
  async sendAgreementStarted({ customerEmail, customerName, agreementNumber, returnDate, vehicle }) {
    return this.send({
      to: customerEmail,
      subject: `Agreement Started — ${agreementNumber}`,
      html: `
        <h2>Your Rental Has Started</h2>
        <p>Dear ${customerName},</p>
        <p>Your rental agreement <b>${agreementNumber}</b> is now active.</p>
        <p><b>Vehicle:</b> ${vehicle}<br>
        <b>Expected Return:</b> ${new Date(returnDate).toLocaleString()}</p>
        <p>Please ensure the vehicle is returned on time to avoid late charges.</p>
      `,
    });
  }

  // Return reminder (1 day before)
  async sendReturnReminder({ customerEmail, customerName, agreementNumber, returnDate, vehicle }) {
    return this.send({
      to: customerEmail,
      subject: `Reminder: Vehicle Return Tomorrow — ${agreementNumber}`,
      html: `
        <h2>Vehicle Return Reminder</h2>
        <p>Dear ${customerName},</p>
        <p>This is a reminder that your rental vehicle is due for return tomorrow.</p>
        <p><b>Agreement:</b> ${agreementNumber}<br>
        <b>Vehicle:</b> ${vehicle}<br>
        <b>Return Date:</b> ${new Date(returnDate).toLocaleString()}</p>
        <p>Please contact us if you need an extension.</p>
      `,
    });
  }

  // Overdue return
  async sendOverdueReturn({ customerEmail, customerName, agreementNumber, vehicle, hoursOverdue }) {
    return this.send({
      to: customerEmail,
      subject: `URGENT: Overdue Return — ${agreementNumber}`,
      html: `
        <h2>⚠️ Vehicle Return Overdue</h2>
        <p>Dear ${customerName},</p>
        <p>Your rental vehicle is <b>${hoursOverdue} hours overdue</b> for return. Late charges are being applied.</p>
        <p><b>Agreement:</b> ${agreementNumber}<br><b>Vehicle:</b> ${vehicle}</p>
        <p>Please return the vehicle immediately or contact us to arrange an extension.</p>
      `,
    });
  }

  // Payment overdue
  async sendPaymentOverdue({ customerEmail, customerName, invoiceNumber, amount, dueDate }) {
    return this.send({
      to: customerEmail,
      subject: `Payment Overdue — Invoice ${invoiceNumber}`,
      html: `
        <h2>Payment Overdue</h2>
        <p>Dear ${customerName},</p>
        <p>Invoice <b>${invoiceNumber}</b> for <b>AED ${amount}</b> was due on ${new Date(dueDate).toLocaleDateString()} and remains unpaid.</p>
        <p>Please make payment at your earliest convenience to avoid further charges.</p>
      `,
    });
  }

  // Document expiry warning
  async sendDocumentExpiryWarning({ to, recipientName, documentType, expiryDate, daysLeft }) {
    return this.send({
      to,
      subject: `Document Expiry Alert: ${documentType}`,
      html: `
        <h2>Document Expiry Alert</h2>
        <p>Dear ${recipientName},</p>
        <p>Your <b>${documentType}</b> is expiring in <b>${daysLeft} days</b> (${new Date(expiryDate).toLocaleDateString()}).</p>
        <p>Please renew your document to avoid service interruptions.</p>
      `,
    });
  }

  // Invoice issued
  async sendInvoice({ customerEmail, customerName, invoiceNumber, amount, dueDate }) {
    return this.send({
      to: customerEmail,
      subject: `Invoice ${invoiceNumber} — AED ${amount}`,
      html: `
        <h2>Invoice Issued</h2>
        <p>Dear ${customerName},</p>
        <p>Invoice <b>${invoiceNumber}</b> for <b>AED ${amount}</b> has been issued.</p>
        <p><b>Due Date:</b> ${new Date(dueDate).toLocaleDateString()}</p>
        <p>Please arrange payment by the due date.</p>
      `,
    });
  }
}

export default new EmailService();
