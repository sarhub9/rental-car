import FeatureRequestModel from '../models/feature-request.model.js';
import CompanyModel from '../models/company.model.js';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@carrental-erp.com';

class FeatureRequestService {
  async submit(data) {
    let companyName = data.company_name || null;
    let contactEmail = data.contact_email || null;

    // If company_id provided, fetch company details
    if (data.company_id) {
      const company = await CompanyModel.findById(data.company_id);
      if (company) {
        companyName = company.name;
        contactEmail = company.contact_email;
      }
    }

    const request = await FeatureRequestModel.create({
      company_id: data.company_id || null,
      company_name: companyName,
      contact_email: contactEmail,
      feature_title: data.feature_title,
      message: data.message,
    });

    // Send email notification (fire and forget)
    this._sendNotificationEmail(request).catch((err) => {
      console.error('Failed to send feature request email:', err);
    });

    return request;
  }

  async listRequests(filters = {}) {
    return FeatureRequestModel.list(filters);
  }

  async updateStatus(id, status) {
    return FeatureRequestModel.updateStatus(id, status);
  }

  async _sendNotificationEmail(request) {
    if (!resend) {
      console.log('Resend not configured — skipping feature request email notification');
      return;
    }

    const html = `
      <h2>New Feature Request</h2>
      <p><strong>Company:</strong> ${request.company_name || 'N/A'}</p>
      <p><strong>Contact:</strong> ${request.contact_email || 'N/A'}</p>
      <p><strong>Feature:</strong> ${request.feature_title}</p>
      <p><strong>Message:</strong></p>
      <p>${request.message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p style="color:#888;font-size:12px">
        Submitted at ${new Date(request.created_at).toLocaleString()}
      </p>
    `;

    await resend.emails.send({
      from: 'CarRental ERP <noreply@carrental-erp.com>',
      to: ADMIN_EMAIL,
      subject: `Feature Request: ${request.feature_title}`,
      html,
    });
  }
}

export default new FeatureRequestService();
