const mongoose = require('mongoose');
const Order = require('../../models/Order');

/**
 * Get Daily Revenue Report
 * Returns revenue breakdown for a specific day
 */
exports.getDailyReport = async (req, res) => {
  try {
    const { date, storeId } = req.query;

    if (!date) {
      return res.status(400).json({
        isOk: false,
        message: 'Date parameter is required',
      });
    }

    // Parse date and set time boundaries
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Build match conditions
    const matchConditions = {
      placedAt: { $gte: startDate, $lte: endDate },
      status: { $nin: ['cancelled'] },
    };

    if (storeId) {
      matchConditions.storeId = new mongoose.Types.ObjectId(storeId);
    }

    // Aggregate daily revenue data
    const dailyData = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.grandTotal' },
          totalOrders: { $sum: 1 },
          totalItems: { $sum: { $size: '$items' } },
          avgOrderValue: { $avg: '$pricing.grandTotal' },
          totalDiscount: { $sum: '$pricing.discount' },
          totalTax: { $sum: '$pricing.totalTax' },
        },
      },
    ]);

    // Hourly breakdown
    const hourlyBreakdown = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: { $hour: '$placedAt' },
          revenue: { $sum: '$pricing.grandTotal' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Payment method breakdown
    const paymentBreakdown = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$payment.method',
          revenue: { $sum: '$pricing.grandTotal' },
          orders: { $sum: 1 },
        },
      },
    ]);

    // Order type breakdown
    const orderTypeBreakdown = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$orderType',
          revenue: { $sum: '$pricing.grandTotal' },
          orders: { $sum: 1 },
        },
      },
    ]);

    res.json({
      isOk: true,
      data: {
        summary: dailyData[0] || {
          totalRevenue: 0,
          totalOrders: 0,
          totalItems: 0,
          avgOrderValue: 0,
          totalDiscount: 0,
          totalTax: 0,
        },
        hourlyBreakdown,
        paymentBreakdown,
        orderTypeBreakdown,
        date: date,
      },
    });
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({
      isOk: false,
      message: 'Failed to generate daily report',
      error: error.message,
    });
  }
};

/**
 * Get Date Range Revenue Report
 * Returns revenue data for a custom date range
 */
exports.getDateRangeReport = async (req, res) => {
  try {
    const { startDate, endDate, storeId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        isOk: false,
        message: 'Start date and end date are required',
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Build match conditions
    const matchConditions = {
      placedAt: { $gte: start, $lte: end },
      status: { $nin: ['cancelled'] },
    };

    if (storeId) {
      matchConditions.storeId = new mongoose.Types.ObjectId(storeId);
    }

    // Overall summary
    const summary = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.grandTotal' },
          totalOrders: { $sum: 1 },
          totalItems: { $sum: { $size: '$items' } },
          avgOrderValue: { $avg: '$pricing.grandTotal' },
          totalDiscount: { $sum: '$pricing.discount' },
          totalTax: { $sum: '$pricing.totalTax' },
        },
      },
    ]);

    // Day-wise breakdown
    const dailyBreakdown = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$placedAt' },
          },
          revenue: { $sum: '$pricing.grandTotal' },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: '$pricing.grandTotal' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Payment method breakdown
    const paymentBreakdown = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$payment.method',
          revenue: { $sum: '$pricing.grandTotal' },
          orders: { $sum: 1 },
        },
      },
    ]);

    // Order type breakdown
    const orderTypeBreakdown = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$orderType',
          revenue: { $sum: '$pricing.grandTotal' },
          orders: { $sum: 1 },
        },
      },
    ]);

    res.json({
      isOk: true,
      data: {
        summary: summary[0] || {
          totalRevenue: 0,
          totalOrders: 0,
          totalItems: 0,
          avgOrderValue: 0,
          totalDiscount: 0,
          totalTax: 0,
        },
        dailyBreakdown,
        paymentBreakdown,
        orderTypeBreakdown,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('Date range report error:', error);
    res.status(500).json({
      isOk: false,
      message: 'Failed to generate date range report',
      error: error.message,
    });
  }
};

/**
 * Get Monthly Revenue Report
 * Returns revenue data for a specific month
 */
exports.getMonthlyReport = async (req, res) => {
  try {
    const { year, month, storeId } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        isOk: false,
        message: 'Year and month parameters are required',
      });
    }

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Build match conditions
    const matchConditions = {
      placedAt: { $gte: startDate, $lte: endDate },
      status: { $nin: ['cancelled'] },
    };

    if (storeId) {
      matchConditions.storeId = new mongoose.Types.ObjectId(storeId);
    }

    // Monthly summary
    const summary = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.grandTotal' },
          totalOrders: { $sum: 1 },
          totalItems: { $sum: { $size: '$items' } },
          avgOrderValue: { $avg: '$pricing.grandTotal' },
          totalDiscount: { $sum: '$pricing.discount' },
          totalTax: { $sum: '$pricing.totalTax' },
        },
      },
    ]);

    // Day-wise breakdown for the month
    const dailyBreakdown = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: { $dayOfMonth: '$placedAt' },
          revenue: { $sum: '$pricing.grandTotal' },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: '$pricing.grandTotal' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Week-wise breakdown
    const weeklyBreakdown = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: { $week: '$placedAt' },
          revenue: { $sum: '$pricing.grandTotal' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Payment method breakdown
    const paymentBreakdown = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$payment.method',
          revenue: { $sum: '$pricing.grandTotal' },
          orders: { $sum: 1 },
        },
      },
    ]);

    // Compare with previous month
    const prevMonthStart = new Date(year, month - 2, 1);
    const prevMonthEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);

    const prevMonthMatchConditions = {
      placedAt: { $gte: prevMonthStart, $lte: prevMonthEnd },
      status: { $nin: ['cancelled'] },
    };

    if (storeId) {
      prevMonthMatchConditions.storeId = new mongoose.Types.ObjectId(storeId);
    }

    const prevMonthSummary = await Order.aggregate([
      { $match: prevMonthMatchConditions },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.grandTotal' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // Calculate growth percentages
    let revenueGrowth = 0;
    let ordersGrowth = 0;

    if (prevMonthSummary.length > 0 && summary.length > 0) {
      const prevRevenue = prevMonthSummary[0].totalRevenue;
      const currRevenue = summary[0].totalRevenue;
      revenueGrowth = prevRevenue > 0 ? ((currRevenue - prevRevenue) / prevRevenue) * 100 : 0;

      const prevOrders = prevMonthSummary[0].totalOrders;
      const currOrders = summary[0].totalOrders;
      ordersGrowth = prevOrders > 0 ? ((currOrders - prevOrders) / prevOrders) * 100 : 0;
    }

    res.json({
      isOk: true,
      data: {
        summary: summary[0] || {
          totalRevenue: 0,
          totalOrders: 0,
          totalItems: 0,
          avgOrderValue: 0,
          totalDiscount: 0,
          totalTax: 0,
        },
        dailyBreakdown,
        weeklyBreakdown,
        paymentBreakdown,
        comparison: {
          previousMonth: prevMonthSummary[0] || { totalRevenue: 0, totalOrders: 0 },
          revenueGrowth: revenueGrowth.toFixed(2),
          ordersGrowth: ordersGrowth.toFixed(2),
        },
        year,
        month,
      },
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({
      isOk: false,
      message: 'Failed to generate monthly report',
      error: error.message,
    });
  }
};

/**
 * Get Product-wise Revenue Report
 * Returns revenue breakdown by product
 */
exports.getProductRevenue = async (req, res) => {
  try {
    const { startDate, endDate, storeId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        isOk: false,
        message: 'Start date and end date are required',
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Build match conditions
    const matchConditions = {
      placedAt: { $gte: start, $lte: end },
      status: { $nin: ['cancelled'] },
    };

    if (storeId) {
      matchConditions.storeId = new mongoose.Types.ObjectId(storeId);
    }

    // Product-wise revenue
    const productRevenue = await Order.aggregate([
      { $match: matchConditions },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            itemName: '$items.itemName',
            itemId: '$items.itemId',
          },
          totalRevenue: { $sum: '$items.itemTotal' },
          quantitySold: { $sum: '$items.quantity' },
          timesOrdered: { $sum: 1 },
        },
      },
      {
        $project: {
          itemName: '$_id.itemName',
          itemId: '$_id.itemId',
          totalRevenue: 1,
          quantitySold: 1,
          timesOrdered: 1,
          avgPrice: { $divide: ['$totalRevenue', '$quantitySold'] },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 50 }, // Top 50 products
    ]);

    // Calculate total revenue for percentage calculation
    const totalRevenue = productRevenue.reduce((sum, item) => sum + item.totalRevenue, 0);

    // Add percentage to each product
    const productsWithPercentage = productRevenue.map((product) => ({
      ...product,
      percentage: totalRevenue > 0 ? ((product.totalRevenue / totalRevenue) * 100).toFixed(2) : 0,
    }));

    res.json({
      isOk: true,
      data: {
        products: productsWithPercentage,
        totalRevenue,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('Product revenue report error:', error);
    res.status(500).json({
      isOk: false,
      message: 'Failed to generate product revenue report',
      error: error.message,
    });
  }
};

/**
 * Get Category-wise Revenue Report
 * Returns revenue breakdown by category
 */
exports.getCategoryRevenue = async (req, res) => {
  try {
    const { startDate, endDate, storeId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        isOk: false,
        message: 'Start date and end date are required',
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Build match conditions
    const matchConditions = {
      placedAt: { $gte: start, $lte: end },
      status: { $nin: ['cancelled'] },
    };

    if (storeId) {
      matchConditions.storeId = new mongoose.Types.ObjectId(storeId);
    }

    // Category-wise revenue
    // Note: This assumes items have category information
    // You may need to lookup from FoodItemMaster collection
    const categoryRevenue = await Order.aggregate([
      { $match: matchConditions },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'fooditemmasters',
          localField: 'items.itemId',
          foreignField: '_id',
          as: 'itemDetails',
        },
      },
      { $unwind: { path: '$itemDetails', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$itemDetails.categoryName',
          totalRevenue: { $sum: '$items.itemTotal' },
          quantitySold: { $sum: '$items.quantity' },
          itemCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    // Calculate total revenue for percentage calculation
    const totalRevenue = categoryRevenue.reduce((sum, item) => sum + item.totalRevenue, 0);

    // Add percentage to each category
    const categoriesWithPercentage = categoryRevenue.map((category) => ({
      categoryName: category._id || 'Uncategorized',
      totalRevenue: category.totalRevenue,
      quantitySold: category.quantitySold,
      itemCount: category.itemCount,
      percentage: totalRevenue > 0 ? ((category.totalRevenue / totalRevenue) * 100).toFixed(2) : 0,
    }));

    res.json({
      isOk: true,
      data: {
        categories: categoriesWithPercentage,
        totalRevenue,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('Category revenue report error:', error);
    res.status(500).json({
      isOk: false,
      message: 'Failed to generate category revenue report',
      error: error.message,
    });
  }
};
