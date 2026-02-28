const express = require('express');
const router = express.Router();
const RevenueReportController = require('../../controllers/v1/RevenueReportController');
const { authMiddleware } = require('../../middlewares/authMiddleware');

// Authentication middleware for revenue reports
// Accessible by admin, superadmin, store admin, and POS users
const auth = authMiddleware(['ADMIN', 'SUPERADMIN', 'STORE_ADMIN', 'storeadmin', 'POS', 'EMPLOYEE']);

/**
 * @route   GET /api/v1/reports/daily
 * @desc    Get daily revenue report
 * @access  Private (Admin, Store Admin, POS)
 * @query   date (required) - Date in YYYY-MM-DD format
 * @query   storeId (optional) - Filter by specific store
 */
router.get('/reports/daily', auth, RevenueReportController.getDailyReport);

/**
 * @route   GET /api/v1/reports/date-range
 * @desc    Get revenue report for a date range
 * @access  Private (Admin, Store Admin, POS)
 * @query   startDate (required) - Start date in YYYY-MM-DD format
 * @query   endDate (required) - End date in YYYY-MM-DD format
 * @query   storeId (optional) - Filter by specific store
 */
router.get('/reports/date-range', auth, RevenueReportController.getDateRangeReport);

/**
 * @route   GET /api/v1/reports/monthly
 * @desc    Get monthly revenue report
 * @access  Private (Admin, Store Admin, POS)
 * @query   year (required) - Year (e.g., 2024)
 * @query   month (required) - Month (1-12)
 * @query   storeId (optional) - Filter by specific store
 */
router.get('/reports/monthly', auth, RevenueReportController.getMonthlyReport);

/**
 * @route   GET /api/v1/reports/product-wise
 * @desc    Get product-wise revenue report
 * @access  Private (Admin, Store Admin, POS)
 * @query   startDate (required) - Start date in YYYY-MM-DD format
 * @query   endDate (required) - End date in YYYY-MM-DD format
 * @query   storeId (optional) - Filter by specific store
 */
router.get('/reports/product-wise', auth, RevenueReportController.getProductRevenue);

/**
 * @route   GET /api/v1/reports/category-wise
 * @desc    Get category-wise revenue report
 * @access  Private (Admin, Store Admin, POS)
 * @query   startDate (required) - Start date in YYYY-MM-DD format
 * @query   endDate (required) - End date in YYYY-MM-DD format
 * @query   storeId (optional) - Filter by specific store
 */
router.get('/reports/category-wise', auth, RevenueReportController.getCategoryRevenue);

module.exports = router;
