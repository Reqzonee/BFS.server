const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middlewares/authMiddleware');
const Order = require('../../models/Order');
const StoreMaster = require('../../models/StoreMaster');

const posOrAdminAuth = authMiddleware(['ADMIN', 'POS', 'EMPLOYEE']);

/**
 * GET /api/v1/dashboard/stats
 * Get dashboard statistics for a store
 */
router.get('/dashboard/stats', posOrAdminAuth, async (req, res) => {
    try {
        const { storeId } = req.query;
        
        if (!storeId) {
            return res.status(400).json({
                success: false,
                message: 'Store ID is required'
            });
        }

        // Get today's date range (UTC)
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

        // Get this month's date range
        const startOfMonth = new Date();
        startOfMonth.setUTCDate(1);
        startOfMonth.setUTCHours(0, 0, 0, 0);

        // Today's stats
        const todayOrders = await Order.find({
            storeId,
            createdAt: { $gte: today, $lt: tomorrow }
        });

        // This month's stats  
        const monthOrders = await Order.find({
            storeId,
            createdAt: { $gte: startOfMonth }
        });

        // Calculate metrics
        const todayRevenue = todayOrders.reduce((sum, order) => 
            sum + (order.pricing?.grandTotal || 0), 0
        );

        const monthRevenue = monthOrders.reduce((sum, order) => 
            sum + (order.pricing?.grandTotal || 0), 0
        );

        const todayOrderCount = todayOrders.length;
        const monthOrderCount = monthOrders.length;

        const avgOrderValue = todayOrderCount > 0 
            ? Math.round(todayRevenue / todayOrderCount) 
            : 0;

        // Payment method breakdown
        const paymentMethods = {
            cod: todayOrders.filter(o => o.payment?.method === 'cod').length,
            online: todayOrders.filter(o => o.payment?.method === 'online').length
        };

        // Top selling items today
        const itemsMap = {};
        todayOrders.forEach(order => {
            order.items?.forEach(item => {
                if (!itemsMap[item.itemName]) {
                    itemsMap[item.itemName] = {
                        name: item.itemName,
                        quantity: 0,
                        revenue: 0
                    };
                }
                itemsMap[item.itemName].quantity += item.quantity;
                itemsMap[item.itemName].revenue += item.itemTotal || (item.basePrice * item.quantity);
            });
        });

        const popularItems = Object.values(itemsMap)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        // Recent orders (last 5)
        const recentOrders = await Order.find({ storeId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('orderNumber customerDetails items pricing createdAt payment status')
            .lean();

        const recentOrdersFormatted = recentOrders.map(order => {
            const now = new Date();
            const orderTime = new Date(order.createdAt);
            const diffMs = now - orderTime;
            const diffMins = Math.floor(diffMs / 60000);
            
            let timeAgo;
            if (diffMins < 60) {
                timeAgo = `${diffMins} mins ago`;
            } else if (diffMins < 1440) {
                timeAgo = `${Math.floor(diffMins / 60)} hours ago`;
            } else {
                timeAgo = `${Math.floor(diffMins / 1440)} days ago`;
            }

            return {
                orderNumber: order.orderNumber,
                customerName: order.customerDetails?.fullName || 'Guest',
                totalItems: order.items?.length || 0,
                totalAmount: order.pricing?.grandTotal || 0,
                paymentMethod: order.payment?.method || 'cod',
                status: order.status || 'pending',
                timeAgo
            };
        });

        // Hourly sales data (for charts)
        const hourlySales = Array(24).fill(0);
        todayOrders.forEach(order => {
            const hour = new Date(order.createdAt).getHours();
            hourlySales[hour] += order.pricing?.grandTotal || 0;
        });

        res.json({
            success: true,
            data: {
                todayRevenue,
                todayOrders: todayOrderCount,
                monthRevenue,
                monthOrders: monthOrderCount,
                averageOrderValue: avgOrderValue,
                paymentMethods,
                popularItems,
                recentOrders: recentOrdersFormatted,
                hourlySales
            }
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard stats',
            error: error.message
        });
    }
});

/**
 * GET /api/v1/dashboard/admin-stats
 * Get aggregated statistics across all stores for Business Owner/Super Admin
 */
router.get('/dashboard/admin-stats', posOrAdminAuth, async (req, res) => {
    try {
        // Get this month's date range
        const startOfMonth = new Date();
        startOfMonth.setUTCDate(1);
        startOfMonth.setUTCHours(0, 0, 0, 0);

        // Get all orders for the month (no store filter)
        const monthOrders = await Order.find({
            createdAt: { $gte: startOfMonth }
        }).lean();

        // Get all orders ever for total calculation
        const allOrders = await Order.find({}).lean();

        // Get all stores
        const allStores = await StoreMaster.find({ isActive: true }).lean();
        const totalStores = allStores.length;

        // Calculate total metrics
        const totalRevenue = allOrders.reduce((sum, order) => 
            sum + (order.pricing?.grandTotal || 0), 0
        );

        const totalOrders = allOrders.length;

        const averageOrderValue = totalOrders > 0 
            ? Math.round(totalRevenue / totalOrders) 
            : 0;

        // Calculate monthly revenue
        const monthRevenue = monthOrders.reduce((sum, order) => 
            sum + (order.pricing?.grandTotal || 0), 0
        );

        // Calculate store-wise performance for the month
        const storePerformance = {};
        monthOrders.forEach(order => {
            const storeId = order.storeId?.toString();
            if (!storePerformance[storeId]) {
                storePerformance[storeId] = {
                    revenue: 0,
                    orders: 0
                };
            }
            storePerformance[storeId].revenue += order.pricing?.grandTotal || 0;
            storePerformance[storeId].orders += 1;
        });

        // Get top 5 stores by monthly revenue
        const topStores = allStores
            .map(store => ({
                storeId: store._id,
                storeName: store.storeName,
                location: `${store.city}, ${store.state}`,
                monthRevenue: storePerformance[store._id?.toString()]?.revenue || 0,
                monthOrders: storePerformance[store._id?.toString()]?.orders || 0,
                status: store.isActive ? 'Active' : 'Inactive'
            }))
            .sort((a, b) => b.monthRevenue - a.monthRevenue)
            .slice(0, 5);

        // Calculate monthly growth (compare current month vs last month)
        const lastMonthStart = new Date(startOfMonth);
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        const lastMonthEnd = new Date(startOfMonth);

        const lastMonthOrders = await Order.find({
            createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd }
        }).lean();

        const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => 
            sum + (order.pricing?.grandTotal || 0), 0
        );

        const monthlyGrowth = lastMonthRevenue > 0 
            ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) 
            : 0;

        // Top performing items across all stores
        const itemsMap = {};
        monthOrders.forEach(order => {
            order.items?.forEach(item => {
                if (!itemsMap[item.itemName]) {
                    itemsMap[item.itemName] = {
                        name: item.itemName,
                        quantity: 0,
                        revenue: 0
                    };
                }
                itemsMap[item.itemName].quantity += item.quantity;
                itemsMap[item.itemName].revenue += item.itemTotal || (item.basePrice * item.quantity);
            });
        });

        const topItems = Object.values(itemsMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        res.json({
            success: true,
            data: {
                totalRevenue,
                totalOrders,
                totalStores,
                averageOrderValue,
                monthRevenue,
                monthlyGrowth,
                topStores,
                topItems
            }
        });

    } catch (error) {
        console.error('Admin dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch admin dashboard stats',
            error: error.message
        });
    }
});

module.exports = router;
