'use client';

interface StatusBadgeProps {
  status: string;
  type?: string;
}

const COLOR_MAP: Record<string, Record<string, { bg: string; text: string }>> = {
  agreement: {
    DRAFT: { bg: 'bg-blue-100', text: 'text-blue-700' },
    ACTIVE: { bg: 'bg-green-100', text: 'text-green-700' },
    CLOSED: { bg: 'bg-gray-100', text: 'text-gray-700' },
  },
  vehicle: {
    AVAILABLE: { bg: 'bg-green-100', text: 'text-green-700' },
    RENTED: { bg: 'bg-blue-100', text: 'text-blue-700' },
    MAINTENANCE: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    OUT_OF_SERVICE: { bg: 'bg-red-100', text: 'text-red-700' },
  },
  invoice: {
    DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700' },
    ISSUED: { bg: 'bg-blue-100', text: 'text-blue-700' },
    PAID: { bg: 'bg-green-100', text: 'text-green-700' },
    PARTIALLY_PAID: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    VOIDED: { bg: 'bg-red-100', text: 'text-red-700' },
    OVERDUE: { bg: 'bg-orange-100', text: 'text-orange-700' },
  },
  task: {
    ASSIGNED: { bg: 'bg-blue-100', text: 'text-blue-700' },
    IN_PROGRESS: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    COMPLETED: { bg: 'bg-green-100', text: 'text-green-700' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700' },
  },
  deposit: {
    HELD: { bg: 'bg-blue-100', text: 'text-blue-700' },
    USED: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    RELEASED: { bg: 'bg-green-100', text: 'text-green-700' },
    FORFEITED: { bg: 'bg-red-100', text: 'text-red-700' },
    REFUNDED: { bg: 'bg-purple-100', text: 'text-purple-700' },
  },
  dispute: {
    OPEN: { bg: 'bg-blue-100', text: 'text-blue-700' },
    IN_REVIEW: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    RESOLVED: { bg: 'bg-green-100', text: 'text-green-700' },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-700' },
  },
};

const DEFAULT_COLORS = { bg: 'bg-gray-100', text: 'text-gray-700' };

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const normalizedStatus = status?.toUpperCase() ?? '';
  const normalizedType = type?.toLowerCase() ?? '';

  let colors = DEFAULT_COLORS;

  if (normalizedType && COLOR_MAP[normalizedType]?.[normalizedStatus]) {
    colors = COLOR_MAP[normalizedType][normalizedStatus];
  } else {
    // Try to find status across all types
    for (const typeMap of Object.values(COLOR_MAP)) {
      if (typeMap[normalizedStatus]) {
        colors = typeMap[normalizedStatus];
        break;
      }
    }
  }

  const displayLabel = normalizedStatus.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}
    >
      {displayLabel}
    </span>
  );
}
