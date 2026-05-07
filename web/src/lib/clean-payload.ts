/**
 * Clean payload for API requests:
 * - Removes empty strings (Joi rejects them for typed fields like uuid, number)
 * - Converts YYYY-MM-DD and YYYY-MM-DDTHH:mm date strings to full ISO 8601
 * - Removes fields that look like empty/invalid UUIDs
 */
export function cleanPayload<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};
  (Object.keys(obj) as Array<keyof T>).forEach((key) => {
    const val = obj[key];

    // Skip empty strings
    if (val === '') return;

    // Skip NaN numbers
    if (typeof val === 'number' && isNaN(val)) return;

    // Convert date strings to ISO 8601 for Joi date().iso() validation
    if (typeof val === 'string') {
      // YYYY-MM-DDTHH:mm (datetime-local input) → ISO
      const dtMatch = val.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})$/);
      if (dtMatch) {
        cleaned[key] = (new Date(val + ':00.000Z').toISOString()) as T[keyof T];
        return;
      }
      // YYYY-MM-DD (date input) → ISO
      const dMatch = val.match(/^(\d{4}-\d{2}-\d{2})$/);
      if (dMatch) {
        cleaned[key] = (new Date(val + 'T00:00:00.000Z').toISOString()) as T[keyof T];
        return;
      }
    }

    cleaned[key] = val;
  });
  return cleaned;
}

/** UUID regex for validation */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Strip out any non-UUID strings from fields that should be UUIDs.
 * Mutates the payload object directly.
 */
export function sanitizeUuidFields(
  payload: Record<string, unknown>,
  uuidFields: string[]
) {
  for (const field of uuidFields) {
    if (
      payload[field] &&
      typeof payload[field] === 'string' &&
      !UUID_REGEX.test(payload[field] as string)
    ) {
      delete payload[field];
    }
  }
}
