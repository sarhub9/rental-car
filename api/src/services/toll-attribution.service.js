import FineTollEventModel from '../models/fine-toll-event.model.js';
import TenantRulesModel from '../models/tenant-rules.model.js';

class TollAttributionService {
  async createEvent(data, tenantId) {
    const rules = await TenantRulesModel.findByTenantId(tenantId);
    const adminFee = rules ? parseFloat(rules.admin_fee_per_toll || 25) : 25;

    // Auto-assign admin fee if not provided
    if (!data.admin_fee) data.admin_fee = adminFee;

    const eventNumber = data.event_number || await FineTollEventModel.generateEventNumber(tenantId);
    const event = await FineTollEventModel.create({ ...data, tenant_id: tenantId, event_number: eventNumber });

    // Immediately attempt auto-attribution
    await this.autoAttribute(event.id, tenantId);
    return await FineTollEventModel.findById(event.id, tenantId);
  }

  async autoAttribute(eventId, tenantId) {
    const event = await FineTollEventModel.findById(eventId, tenantId);
    if (!event || event.attribution_status !== 'UNATTRIBUTED') return event;

    const matches = await FineTollEventModel.findMatchingAgreements(
      tenantId, event.plate_number, event.event_datetime
    );

    if (matches.length === 0) {
      await FineTollEventModel.setConflict(eventId, tenantId, 'No matching rental agreement found for plate+datetime');
      return;
    }

    if (matches.length === 1) {
      const match = matches[0];
      await FineTollEventModel.attribute(
        eventId, tenantId,
        match.id, match.customer_id,
        'AUTO', null
      );
    } else {
      // Multiple matches = conflict
      const conflictNotes = `Multiple agreements match: ${matches.map(m => m.agreement_number).join(', ')}`;
      await FineTollEventModel.setConflict(eventId, tenantId, conflictNotes);
    }
  }

  async manualAttribute(eventId, tenantId, agreementId, customerId, userId) {
    return await FineTollEventModel.attribute(eventId, tenantId, agreementId, customerId, 'MANUAL', userId);
  }

  async waive(eventId, tenantId) {
    return await FineTollEventModel.setWaived(eventId, tenantId);
  }

  async getById(id, tenantId) {
    const event = await FineTollEventModel.findById(id, tenantId);
    if (!event) {
      const err = new Error('Toll/Fine event not found');
      err.statusCode = 404;
      throw err;
    }
    return event;
  }

  async list(tenantId, filters = {}) {
    return await FineTollEventModel.list(tenantId, filters);
  }

  async bulkImport(events, tenantId) {
    const results = { success: 0, failed: 0, errors: [] };
    for (const evt of events) {
      try {
        await this.createEvent(evt, tenantId);
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ event: evt.event_number, error: err.message });
      }
    }
    return results;
  }

  async getPendingAttributionSummary(tenantId) {
    const events = await FineTollEventModel.list(tenantId, { attribution_status: 'UNATTRIBUTED' });
    const conflicts = await FineTollEventModel.list(tenantId, { attribution_status: 'CONFLICT' });
    return {
      unattributed_count: events.length,
      unattributed_total: events.reduce((s, e) => s + parseFloat(e.total_amount), 0),
      conflict_count: conflicts.length,
      conflict_total: conflicts.reduce((s, e) => s + parseFloat(e.total_amount), 0),
    };
  }
}

export default new TollAttributionService();
