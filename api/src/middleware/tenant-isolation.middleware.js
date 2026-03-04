/**
 * Tenant Isolation Middleware
 * Ensures all database queries are scoped to the authenticated user's tenant
 */
export const enforceTenantIsolation = (req, res, next) => {
  if (!req.user || !req.user.tenantId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Tenant information missing from authentication',
    });
  }

  // Attach tenant ID to request for easy access in controllers/services
  req.tenantId = req.user.tenantId;

  next();
};

/**
 * Validate that a resource belongs to the authenticated user's tenant
 * Used in controllers to verify tenant ownership before operations
 */
export const validateTenantOwnership = (resourceTenantId, requestTenantId) => {
  if (resourceTenantId !== requestTenantId) {
    const error = new Error('Access denied: Resource belongs to different tenant');
    error.statusCode = 403;
    throw error;
  }
};
