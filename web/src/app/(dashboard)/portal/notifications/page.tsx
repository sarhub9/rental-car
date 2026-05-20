'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
  HiOutlineCurrencyDollar,
  HiOutlineTruck,
  HiOutlineCheck,
} from 'react-icons/hi2';
import { customerPortalService } from '@/services/customer-portal.service';
import { extractApiError } from '@/lib/api-error';

const NOTIFICATION_ICONS: Record<string, { icon: any; bg: string; color: string }> = {
  payment:   { icon: HiOutlineCurrencyDollar, bg: 'bg-green-50',  color: 'text-green-600' },
  invoice:   { icon: HiOutlineCurrencyDollar, bg: 'bg-green-50',  color: 'text-green-600' },
  rental:    { icon: HiOutlineTruck,           bg: 'bg-blue-50',   color: 'text-blue-600' },
  agreement: { icon: HiOutlineTruck,           bg: 'bg-blue-50',   color: 'text-blue-600' },
  warning:   { icon: HiOutlineExclamationTriangle, bg: 'bg-amber-50', color: 'text-amber-600' },
  alert:     { icon: HiOutlineExclamationTriangle, bg: 'bg-amber-50', color: 'text-amber-600' },
  success:   { icon: HiOutlineCheckCircle,     bg: 'bg-green-50',  color: 'text-green-600' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await customerPortalService.getCustomerNotifications();
      setNotifications(Array.isArray(res) ? res : []);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load notifications'));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (notificationId: string) => {
    try {
      await customerPortalService.markNotificationAsRead(notificationId);
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)));
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await customerPortalService.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to mark all as read'));
    }
  };

  const getIconInfo = (type: string) =>
    NOTIFICATION_ICONS[type?.toLowerCase()] || { icon: HiOutlineInformationCircle, bg: 'bg-blue-50', color: 'text-blue-600' };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'You are all caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-100 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <HiOutlineCheck className="h-4 w-4" />
            Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
            <HiOutlineBell className="h-7 w-7 text-gray-400" />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-600">No notifications.</p>
          <p className="mt-1 text-xs text-gray-400">You're all caught up!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
          {notifications.map((notification) => {
            const { icon: Icon, bg, color } = getIconInfo(notification.type || notification.notification_type);
            return (
              <div
                key={notification.id}
                onClick={() => { if (!notification.is_read) handleMarkRead(notification.id); }}
                className={`flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer ${
                  notification.is_read ? 'hover:bg-gray-50' : 'bg-primary-50/40 hover:bg-primary-50'
                }`}
              >
                <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${notification.is_read ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                      {notification.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 leading-snug">
                    {notification.body || notification.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
