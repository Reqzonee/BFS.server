const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middlewares/authMiddleware');
const Coupon = require('../../models/Coupon');

const posOrAdminAuth = authMiddleware(['ADMIN', 'POS', 'EMPLOYEE']);

/**
 * GET /api/v1/coupons
 * Get all coupons
 */
router.get('/coupons', posOrAdminAuth, async (req, res) => {
    try {
        const { status, storeId } = req.query;
        
        const filter = {};
        if (status && status !== 'all') {
            filter.status = status;
        }

        // If storeId provided, filter by applicable stores
        if (storeId) {
            filter.$or = [
                { applicableStores: { $size: 0 } }, // Applicable to all
                { applicableStores: storeId }
            ];
        }

        const coupons = await Coupon.find(filter)
            .sort({ createdAt: -1 })
            .populate('createdBy', 'companyName email')
            .lean();

        res.json({
            success: true,
            data: coupons
        });

    } catch (error) {
        console.error('Fetch coupons error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch coupons',
            error: error.message
        });
    }
});

/**
 * POST /api/v1/coupons
 * Create a new coupon
 */
router.post('/coupons', posOrAdminAuth, async (req, res) => {
    try {
        const {
            code,
            type,
            value,
            description,
            expiryDate,
            usageLimit,
            minOrderValue,
            maxDiscountAmount,
            applicableStores
        } = req.body;

        // Validate required fields
        if (!code || !type || value === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Code, type, and value are required'
            });
        }

        // Check if coupon code already exists
        const existing = await Coupon.findOne({ code: code.toUpperCase() });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists'
            });
        }

        const coupon = new Coupon({
            code: code.toUpperCase(),
            type,
            value: Number(value),
            description: description || '',
            expiryDate: expiryDate || null,
            usageLimit: usageLimit || null,
            minOrderValue: minOrderValue || 0,
            maxDiscountAmount: maxDiscountAmount || null,
            applicableStores: applicableStores || [],
            createdBy: req.user.id,
            status: 'active'
        });

        await coupon.save();

        res.status(201).json({
            success: true,
            message: 'Coupon created successfully',
            data: coupon
        });

    } catch (error) {
        console.error('Create coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create coupon',
            error: error.message
        });
    }
});

/**
 * POST /api/v1/coupons/validate
 * Validate and apply a coupon code
 */
router.post('/coupons/validate', posOrAdminAuth, async (req, res) => {
    try {
        const { code, orderAmount, storeId } = req.body;

        if (!code || !orderAmount) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code and order amount are required'
            });
        }

        // Find the coupon
        const coupon = await Coupon.findOne({ 
            code: code.toUpperCase()
        });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Invalid coupon code'
            });
        }

        // Check if coupon is valid
        if (!coupon.isValid()) {
            let reason = 'Coupon is not active';
            if (coupon.status === 'expired') reason = 'Coupon has expired';
            if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) reason = 'Coupon has expired';
            if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) reason = 'Coupon usage limit reached';
            
            return res.status(400).json({
                success: false,
                message: reason
            });
        }

        // Check if applicable to this store
        if (storeId && coupon.applicableStores.length > 0) {
            const isApplicable = coupon.applicableStores.some(
                s => s.toString() === storeId.toString()
            );
            if (!isApplicable) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon not applicable to this store'
                });
            }
        }

        // Check minimum order value
        if (orderAmount < coupon.minOrderValue) {
            return res.status(400).json({
                success: false,
                message: `Minimum order value of ₹${coupon.minOrderValue} required`
            });
        }

        // Calculate discount
        const discount = coupon.calculateDiscount(orderAmount);

        res.json({
            success: true,
            message: 'Coupon applied successfully',
            data: {
                couponId: coupon._id,
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                discount: Math.round(discount * 100) / 100,
                finalAmount: Math.round((orderAmount - discount) * 100) / 100
            }
        });

    } catch (error) {
        console.error('Validate coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate coupon',
            error: error.message
        });
    }
});

/**
 * PUT /api/v1/coupons/:id
 * Update coupon status or details
 */
router.put('/coupons/:id', posOrAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Don't allow changing code or createdBy
        delete updates.code;
        delete updates.createdBy;
        delete updates.usageCount; // Managed by system

        const coupon = await Coupon.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        res.json({
            success: true,
            message: 'Coupon updated successfully',
            data: coupon
        });

    } catch (error) {
        console.error('Update coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update coupon',
            error: error.message
        });
    }
});

/**
 * DELETE /api/v1/coupons/:id
 * Delete a coupon
 */
router.delete('/coupons/:id', posOrAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const coupon = await Coupon.findByIdAndDelete(id);

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        res.json({
            success: true,
            message: 'Coupon deleted successfully'
        });

    } catch (error) {
        console.error('Delete coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete coupon',
            error: error.message
        });
    }
});

module.exports = router;
