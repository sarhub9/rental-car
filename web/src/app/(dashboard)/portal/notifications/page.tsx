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
} from 'react-icons/hi2';
import { customerPortalService } from '@/services/customer-portal.service';

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
      setNotifications(res.data?.data || res.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (notificationId: string) => {
    try {
      await customerPortalService.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
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
      toast.error(err?.response?.data?.message || 'Failed to mark all as read');
    }
  };

  const getIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'payment':
      case 'invoice':
        return <HiOutlineCurrencyDollar className="h-5 w-5 text-green-600" />;
      case 'rental':
      case 'agreement':
        return <HiOutlineTruck className="h-5 w-5 text-blue-600" />;
      case 'warning':
      case 'alert':
        return <HiOutlineExclamationTriangle className="h-5 w-5 text-amber-600" />;
      case 'success':
        return <HiOutlineCheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <HiOutlineInformationCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'You are all caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <HiOutlineCheckCircle className="h-4 w-4" />
            Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <HiOutlineBell className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">No notifications.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => {
                if (!notification.is_read) handleMarkRead(notification.id);
              }}
              className={`flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${
                notification.is_read
                  ? 'bg-white border-gray-200'
                  : 'bg-primary-50 border-primary-200 hover:bg-primary-100'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(notification.type || notification.notification_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`text-sm ${
                      notification.is_read
                        ? 'text-gray-700'
                        : 'text-gray-900 font-semibold'
                    }`}
                  >
                    {notification.title}
                  </p>
                  {!notification.is_read && (
                    <span className="flex-shrink-0 w-2 h-2 mt-1.5 bg-primary-600 rounded-full" />
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {notification.body || notification.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
