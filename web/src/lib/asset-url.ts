// Normalizes an uploaded-file URL to a same-origin relative path so it loads
// through this app's /uploads proxy (see next.config.ts rewrites).
//
// The API may return an absolute URL whose host is unreachable from the browser
// in production (e.g. http://localhost:PORT/uploads/... when PUBLIC_BASE_URL is
// not set on the server). Stripping everything up to "/uploads/" makes the
// browser request "/uploads/..." on the current origin, which is proxied to the
// API — avoiding cross-origin/CORP and localhost issues entirely.
//
// - data: URLs (e.g. freshly-drawn signatures) are returned unchanged.
// - External URLs without "/uploads/" (e.g. a pasted logo) are returned as-is.
export function resolveUpload(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  const i = url.indexOf('/uploads/');
  return i >= 0 ? url.slice(i) : url;
}
