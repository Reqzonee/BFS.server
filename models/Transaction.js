const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema(
  {
    // Transaction Identification
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // References
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "StoreMaster",
      required: true,
      index: true,
    },

    // Transaction Type
    type: {
      type: String,
      enum: ["payment", "refund", "partial_payment"],
      required: true,
    },

    // Payment Method
    method: {
      type: String,
      enum: ["cod", "online", "card", "upi", "wallet"],
      required: true,
    },

    // Amount Details
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },

    // Transaction Status
    status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled"],
      default: "pending",
      index: true,
    },

    // Gateway Details (for online payments - future)
    gateway: {
      name: {
        type: String,
        enum: ["razorpay", "stripe", "paytm", "mock"],
        default: "mock",
      },
      gatewayTransactionId: String,
      gatewayOrderId: String,
      paymentResponse: Schema.Types.Mixed, // Full gateway response
    },

    // Timestamps
    initiatedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    failedAt: Date,

    // Failure Details
    failureReason: String,
    failureCode: String,

    // Billing & Accounting
    invoiceNumber: String,
    receiptNumber: String,

    // Notes
    notes: String,

    // Metadata for POS Integration (future)
    posDetails: {
      terminalId: String,
      operatorId: String,
      shiftId: String,
      counterNumber: String,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Indexes for performance
transactionSchema.index({ orderId: 1, createdAt: -1 });
transactionSchema.index({ customerId: 1, createdAt: -1 });
transactionSchema.index({ storeId: 1, status: 1 });
transactionSchema.index({ status: 1, completedAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
