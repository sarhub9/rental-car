import express from 'express';
import CustomerPortalController from '../controllers/customer-portal.controller.js';
import InvoiceController from '../controllers/invoice.controller.js';
import DisputeController from '../controllers/dispute.controller.js';
import NotificationController from '../controllers/notification.controller.js';
import MessageController from '../controllers/message.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();

// Apply authentication, role check, and tenant isolation to all routes
router.use(authenticate);
router.use(requireRole('RENTAL_CUSTOMER'));
router.use(enforceTenantIsolation);

/**
 * @route   GET /v1/customer/dashboard
 * @desc    Get customer dashboard data
 * @access  Rental Customer
 */
router.get('/dashboard', CustomerPortalController.getDashboard);

/**
 * @route   GET /v1/customer/agreements
 * @desc    List customer's agreements
 * @access  Rental Customer
 */
router.get('/agreements', CustomerPortalController.getAgreements);

/**
 * @route   GET /v1/customer/agreements/:id
 * @desc    Get agreement detail
 * @access  Rental Customer (own agreements only)
 */
router.get('/agreements/:id', CustomerPortalController.getAgreementDetail);

/**
 * @route   GET /v1/customer/agreements/:id/evidence
 * @desc    Get agreement evidence
 * @access  Rental Customer (own agreements only)
 */
router.get('/agreements/:id/evidence', CustomerPortalController.getAgreementEvidence);

/**
 * @route   GET /v1/customer/agreements/:id/charges
 * @desc    Get agreement charges
 * @access  Rental Customer (own agreements only)
 */
router.get('/agreements/:id/charges', CustomerPortalController.getAgreementCharges);

/**
 * @route   GET /v1/customer/profile
 * @desc    Get customer profile
 * @access  Rental Customer
 */
router.get('/profile', CustomerPortalController.getProfile);

/**
 * @route   PATCH /v1/customer/profile
 * @desc    Update customer profile
 * @access  Rental Customer
 */
router.patch('/profile', CustomerPortalController.updateProfile);

// ---- Invoice & Payment Routes ----

/**
 * @route   GET /v1/customer/invoices
 * @desc    List customer's invoices
 * @access  Rental Customer
 */
router.get('/invoices', InvoiceController.getCustomerInvoices);

/**
 * @route   GET /v1/customer/invoices/:id
 * @desc    Get invoice detail
 * @access  Rental Customer (own invoices only)
 */
router.get('/invoices/:id', InvoiceController.getCustomerInvoiceDetail);

/**
 * @route   GET /v1/customer/payments
 * @desc    Get payment history
 * @access  Rental Customer
 */
router.get('/payments', InvoiceController.getCustomerPayments);

// ---- Dispute Routes ----

/**
 * @route   POST /v1/customer/disputes
 * @desc    Create a new dispute
 * @access  Rental Customer
 */
router.post('/disputes', DisputeController.createDispute);

/**
 * @route   GET /v1/customer/disputes
 * @desc    List customer's disputes
 * @access  Rental Customer
 */
router.get('/disputes', DisputeController.getCustomerDisputes);

/**
 * @route   GET /v1/customer/disputes/:id
 * @desc    Get dispute detail with messages
 * @access  Rental Customer (own disputes only)
 */
router.get('/disputes/:id', DisputeController.getCustomerDisputeDetail);

/**
 * @route   POST /v1/customer/disputes/:id/messages
 * @desc    Add message to dispute
 * @access  Rental Customer (own disputes only)
 */
router.post('/disputes/:id/messages', DisputeController.addCustomerMessage);

// ---- Notification Routes ----

/**
 * @route   GET /v1/customer/notifications
 * @desc    List customer's notifications
 * @access  Rental Customer
 */
router.get('/notifications', NotificationController.getNotifications);

/**
 * @route   GET /v1/customer/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Rental Customer
 */
router.get('/notifications/unread-count', NotificationController.getUnreadCount);

/**
 * @route   POST /v1/customer/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Rental Customer
 */
router.post('/notifications/:id/read', NotificationController.markAsRead);

/**
 * @route   POST /v1/customer/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Rental Customer
 */
router.post('/notifications/read-all', NotificationController.markAllAsRead);

// ---- Device Token Routes ----

/**
 * @route   POST /v1/customer/devices
 * @desc    Register device for push notifications
 * @access  Rental Customer
 */
router.post('/devices', NotificationController.registerDevice);

/**
 * @route   DELETE /v1/customer/devices
 * @desc    Unregister device
 * @access  Rental Customer
 */
router.delete('/devices', NotificationController.unregisterDevice);

// ---- Message Routes ----

/**
 * @route   POST /v1/customer/messages
 * @desc    Create a new message thread
 * @access  Rental Customer
 */
router.post('/messages', MessageController.createThread);

/**
 * @route   GET /v1/customer/messages
 * @desc    List customer's message threads
 * @access  Rental Customer
 */
router.get('/messages', MessageController.getCustomerThreads);

/**
 * @route   GET /v1/customer/messages/unread-count
 * @desc    Get unread message count
 * @access  Rental Customer
 */
router.get('/messages/unread-count', MessageController.getUnreadCount);

/**
 * @route   GET /v1/customer/messages/:id
 * @desc    Get thread with messages
 * @access  Rental Customer (own threads only)
 */
router.get('/messages/:id', MessageController.getCustomerThread);

/**
 * @route   POST /v1/customer/messages/:id/messages
 * @desc    Add message to thread
 * @access  Rental Customer (own threads only)
 */
router.post('/messages/:id/messages', MessageController.addCustomerMessage);

/**
 * @route   POST /v1/customer/messages/:id/read
 * @desc    Mark thread messages as read
 * @access  Rental Customer (own threads only)
 */
router.post('/messages/:id/read', MessageController.markAsRead);

export default router;
