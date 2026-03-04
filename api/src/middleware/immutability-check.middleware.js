import pool from '../config/database.js';

/**
 * Immutability Check Middleware
 * Prevents modifications to agreements based on their status
 */
export const checkAgreementImmutability = async (req, res, next) => {
  try {
    const agreementId = req.params.id || req.params.agreementId;

    if (!agreementId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Agreement ID is required',
      });
    }

    // Query agreement status
    const result = await pool.query(
      'SELECT status, is_immutable FROM rental_agreements WHERE id = $1 AND tenant_id = $2',
      [agreementId, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Agreement not found',
      });
    }

    const { status, is_immutable } = result.rows[0];

    // Check if agreement is closed (fully immutable)
    if (status === 'CLOSED') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Closed agreements cannot be modified. Use credit notes for adjustments.',
      });
    }

    // Check if agreement is active (partially immutable)
    if (status === 'ACTIVE' && req.method !== 'GET') {
      // Allow only return operations on active agreements
      if (!req.path.includes('/return')) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Active agreements cannot be modified. Only return operations are allowed.',
        });
      }
    }

    // Attach agreement status to request for use in controllers
    req.agreementStatus = status;
    req.agreementImmutable = is_immutable;

    next();
  } catch (error) {
    console.error('Immutability check error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify agreement immutability',
    });
  }
};
