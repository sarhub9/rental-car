/**
 * Extracts a human-readable error message from an API error.
 * Handles Joi/express-validator details arrays, single message strings,
 * HTTP status codes, and network errors.
 */
export function extractApiError(err: any, fallback = 'Something went wrong'): string {
  // Joi / express-validator validation details array
  const details = err?.response?.data?.details;
  if (Array.isArray(details) && details.length > 0) {
    return details.map((d: any) => d.message || d.msg || String(d)).join(' · ');
  }

  // Single message from API body
  const msg = err?.response?.data?.message || err?.response?.data?.error;
  if (msg) return String(msg);

  // HTTP status fallbacks
  const status = err?.response?.status;
  if (status === 400) return err?.response?.data?.message || 'Invalid request';
  if (status === 401) return 'Session expired — please log in again';
  if (status === 403) return 'You do not have permission to perform this action';
  if (status === 404) return 'Record not found';
  if (status === 409) return err?.response?.data?.message || 'Conflict — record already exists';
  if (status >= 500) return 'Server error — please try again later';

  // Network / JS errors
  if (err?.code === 'NETWORK_ERROR' || err?.message === 'Network Error') {
    return 'Network error — check your connection and try again';
  }
  if (err?.message) return String(err.message);

  return fallback;
}
