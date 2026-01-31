const Order = require("../../models/Order");
const { emitToRoom } = require("../../utils/socket");

/**
 * Get orders for a specific store with filtering and pagination
 * GET /api/v1/admin/orders
 */
exports.getStoreOrders = async (req, res) => {
    try {
        const { storeId } = req.query; // If superadmin, can query any store
        const employeeStoreId = req.user.storeId; // From auth middleware

        // Security: If not superadmin, must only view their own store's orders
        const targetStoreId = employeeStoreId || storeId;

        if (!targetStoreId) {
            return res.status(400).json({
                success: false,
                message: "storeId is required",
            });
        }

        const {
            page = 1,
            limit = 10,
            status,
            orderType,
            search,
        } = req.query;

        const query = { storeId: targetStoreId };

        if (status && status !== "all") {
            query.status = status;
        }

        if (orderType && orderType !== "all") {
            query.orderType = orderType;
        }

        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: "i" } },
                { "customerDetails.fullName": { $regex: search, $options: "i" } },
                { "customerDetails.mobileNumber": { $regex: search, $options: "i" } },
            ];
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean();

        const totalOrders = await Order.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                totalOrders,
                totalPages: Math.ceil(totalOrders / limitNum),
                currentPage: pageNum,
                limit: limitNum,
            },
        });
    } catch (error) {
        console.error("Get Store Orders Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Get single order details
 * GET /api/v1/admin/orders/:orderNumber
 */
exports.getOrderDetails = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const employeeStoreId = req.user.storeId;

        const order = await Order.findOne({ orderNumber }).lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Security check
        if (employeeStoreId && order.storeId.toString() !== employeeStoreId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: Order belongs to another store",
            });
        }

        return res.status(200).json({
            success: true,
            data: order,
        });
    } catch (error) {
        console.error("Get Order Details Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Update order status and emit real-time event
 * PUT /api/v1/admin/orders/:orderNumber/status
 */
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const { status, notes } = req.body;
        const employeeStoreId = req.user.storeId;
        const employeeId = req.user.id;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required",
            });
        }

        const order = await Order.findOne({ orderNumber });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Security check
        if (employeeStoreId && order.storeId.toString() !== employeeStoreId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: Order belongs to another store",
            });
        }

        // Update status
        const previousStatus = order.status;
        order.status = status;
        order.statusHistory.push({
            status,
            updatedAt: new Date(),
            updatedBy: "store",
            notes: notes || `Status updated from ${previousStatus} to ${status}`,
        });

        await order.save();

        // Emit real-time update to customer
        emitToRoom(`customer:${order.customerId}`, "order_status_update", {
            orderNumber: order.orderNumber,
            status: order.status,
            updatedAt: new Date(),
            notes: notes || `Your order status changed to ${status}`,
        });

        return res.status(200).json({
            success: true,
            message: `Order status updated to ${status}`,
            data: order,
        });
    } catch (error) {
        console.error("Update Order Status Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
