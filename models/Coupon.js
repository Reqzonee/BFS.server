const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
      default: 'percentage'
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'inactive'],
      default: 'active'
    },
    expiryDate: {
      type: Date,
      default: null
    },
    usageLimit: {
      type: Number,
      default: null // null = unlimited
    },
    usageCount: {
      type: Number,
      default: 0
    },
    minOrderValue: {
      type: Number,
      default: 0
    },
    maxDiscountAmount: {
      type: Number,
      default: null // Only for percentage type
    },
    applicableStores: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StoreMaster'
    }], // Empty array = applicable to all stores
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyMaster',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Check if coupon is valid
couponSchema.methods.isValid = function() {
  if (this.status !== 'active') return false;
  if (this.expiryDate && new Date(this.expiryDate) < new Date()) return false;
  if (this.usageLimit && this.usageCount >= this.usageLimit) return false;
  return true;
};

// Calculate discount for a given order amount
couponSchema.methods.calculateDiscount = function(orderAmount) {
  if (!this.isValid()) return 0;
  if (orderAmount < this.minOrderValue) return 0;

  let discount = 0;
  
  if (this.type === 'percentage') {
    discount = (orderAmount * this.value) / 100;
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
  } else if (this.type === 'fixed') {
    discount = this.value;
  }

  // Discount cannot exceed order amount
  return Math.min(discount, orderAmount);
};

// Increment usage count
couponSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  return await this.save();
};

module.exports = mongoose.model('Coupon', couponSchema);
