import { Router } from 'express';
import { requireAuth, optionalAuth, requireRole } from '../middleware/auth.js';
import * as authCtrl from '../controllers/authController.js';
import * as prodCtrl from '../controllers/productController.js';
import * as orderCtrl from '../controllers/orderController.js';
import * as revCtrl from '../controllers/reviewController.js';
import * as iqCtrl from '../controllers/inventoryQualityController.js';
import * as supCtrl from '../controllers/supplierController.js';
import * as logCtrl from '../controllers/logisticsController.js';
import * as complaintCtrl from '../controllers/complaintController.js';

const router = Router();

// ==========================================
// AUTHENTICATION & PROFILE
// ==========================================
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', requireAuth, authCtrl.getCurrentUser);
router.put('/auth/profile', requireAuth, authCtrl.updateProfile);

// Delivery Addresses
router.get('/auth/addresses', requireAuth, authCtrl.getAddresses);
router.post('/auth/addresses', requireAuth, authCtrl.createAddress);
router.delete('/auth/addresses/:id', requireAuth, authCtrl.deleteAddress);
router.put('/auth/addresses/:id/default', requireAuth, authCtrl.setDefaultAddress);

// ==========================================
// PRODUCTS & CATEGORIES
// ==========================================
router.get('/products', prodCtrl.listProducts);
router.get('/products/:identifier', prodCtrl.getProductByIdOrSlug);
router.get('/categories', prodCtrl.listCategories);

// Protected Product Management (Admin or Supplier)
router.post('/products', requireAuth, requireRole('admin', 'supplier'), prodCtrl.createProduct);
router.put('/products/:id', requireAuth, requireRole('admin', 'supplier'), prodCtrl.updateProduct);
router.delete('/products/:id', requireAuth, requireRole('admin'), prodCtrl.deleteProduct);

// ==========================================
// ORDERS & FULFILLMENT
// ==========================================
// Checkout allows guests or authenticated users
router.post('/orders', optionalAuth, orderCtrl.createOrder);
router.get('/orders/my', requireAuth, orderCtrl.getUserOrders);
router.get('/orders/:identifier', optionalAuth, orderCtrl.getOrderDetails);
router.post('/orders/:id/cancel', requireAuth, orderCtrl.cancelOrder);

// Admin Order Management
router.get('/admin/orders', requireAuth, requireRole('admin'), orderCtrl.adminListOrders);
router.put('/admin/orders/:id/status', requireAuth, requireRole('admin'), orderCtrl.updateOrderStatusAdmin);

// ==========================================
// REAL-TIME FULFILLMENT STREAM & LOGISTICS SUPERVISOR
// ==========================================
// Real-Time SSE Stream (Subscribable by Customers, Admin, and Logistics)
router.get('/fulfillment/stream', logCtrl.fulfillmentStream);

// Logistics Supervisor Operations
router.get('/logistics/orders', requireAuth, requireRole('logistics', 'admin'), logCtrl.getLogisticsOrders);
router.put('/logistics/orders/:id/status', requireAuth, requireRole('logistics', 'admin'), logCtrl.updateLogisticsOrderStatus);
router.post('/logistics/orders/:id/courier', requireAuth, requireRole('logistics', 'admin'), logCtrl.assignCourier);
router.get('/logistics/metrics', requireAuth, requireRole('logistics', 'admin'), logCtrl.getLogisticsMetrics);

// ==========================================
// REVIEWS
// ==========================================
router.get('/reviews/eligibility/:productId', requireAuth, revCtrl.checkReviewEligibility);
router.post('/reviews', requireAuth, revCtrl.createReview);
router.get('/admin/reviews', requireAuth, requireRole('admin'), revCtrl.adminListReviews);
router.put('/admin/reviews/:id', requireAuth, requireRole('admin'), revCtrl.adminModerateReview);

// ==========================================
// INVENTORY & QUALITY CHECKS
// ==========================================
router.get('/inventory/low-stock', requireAuth, requireRole('admin'), iqCtrl.getLowStock);
router.post('/inventory/adjust', requireAuth, requireRole('admin'), iqCtrl.adjustStock);
router.get('/inventory/logs', requireAuth, requireRole('admin'), iqCtrl.getInventoryLogs);

router.get('/quality/logs', iqCtrl.getQualityLogs);
router.post('/quality/certify', requireAuth, requireRole('admin'), iqCtrl.certifySingleProduce);
router.post('/quality/batch-certify', requireAuth, requireRole('admin'), iqCtrl.runBatchQualityAudit);

// ==========================================
// COUPONS & COMPLAINTS
// ==========================================
router.post('/coupons/validate', iqCtrl.validateCoupon);
router.post('/complaints', optionalAuth, complaintCtrl.submitComplaint);
router.get('/complaints/track/:ticket', complaintCtrl.getComplaintByTicket);
router.get('/complaints/my', requireAuth, complaintCtrl.getUserComplaints);
router.get('/admin/complaints', requireAuth, requireRole('admin'), complaintCtrl.adminListComplaints);
router.put('/admin/complaints/:id/reply', requireAuth, requireRole('admin'), complaintCtrl.adminReplyComplaint);

// ==========================================
// SUPPLIER & GROWER PORTAL
// ==========================================
router.get('/supplier/stats', requireAuth, requireRole('supplier', 'admin'), supCtrl.getSupplierStats);
router.get('/supplier/products', requireAuth, requireRole('supplier', 'admin'), supCtrl.getSupplierProducts);
router.get('/supplier/orders', requireAuth, requireRole('supplier', 'admin'), supCtrl.getSupplierOrders);
router.post('/supplier/harvest-batch', requireAuth, requireRole('supplier', 'admin'), supCtrl.submitHarvestBatch);

// ==========================================
// ANALYTICS & CSV REPORTS
// ==========================================
router.get('/analytics/overview', requireAuth, requireRole('admin'), iqCtrl.getAnalyticsOverview);
router.get('/analytics/trends', requireAuth, requireRole('admin'), iqCtrl.getSalesTrends);
router.get('/analytics/categories', requireAuth, requireRole('admin'), iqCtrl.getCategoryDistribution);
router.get('/analytics/export/orders.csv', requireAuth, requireRole('admin'), iqCtrl.exportOrdersCsv);

export default router;
