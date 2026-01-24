const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    // Order Identification
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // References
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

    // Customer Details (Snapshot at order time)
    customerDetails: {
      fullName: { type: String, required: true },
      mobileNumber: { type: String, required: true },
      email: String,
    },

    // Store Details (Snapshot at order time)
    storeDetails: {
      storeName: { type: String, required: true },
      storeCode: { type: String, required: true },
      address: String,
      contactNumber: String,
    },

    // Order Type
    orderType: {
      type: String,
      enum: ["delivery", "pickup", "dine-in"],
      required: true,
    },

    // Delivery Address (if orderType === "delivery")
    deliveryAddress: {
      addressType: {
        type: String,
        enum: ["home", "work", "other"],
      },
      houseNumber: String,
      street: String,
      area: String,
      landmark: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
      location: {
        type: {
          type: String,
          enum: ["Point"],
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
        },
      },
    },

    // Items (Snapshot from cart at checkout)
    items: [
      {
        itemId: {
          type: Schema.Types.ObjectId,
          required: true,
          refPath: "items.itemType",
        },
        itemType: {
          type: String,
          enum: ["FoodItemMaster", "MerchandiseMaster", "ComboMaster"],
          required: true,
        },
        itemName: {
          type: String,
          required: true,
        },
        itemCode: String,
        basePrice: {
          type: Number,
          required: true,
        },

        // Variant Selection (for items with variants)
        selectedVariant: {
          combination: {
            type: Map,
            of: String, // e.g., { "Size": "Small", "Crust": "Thin" }
          },
          price: Number,
          itemCode: String,
        },

        // Add-ons (for food items)
        addOns: [
          {
            addOnId: Schema.Types.ObjectId,
            addOnName: String,
            price: Number,
            quantity: Number,
          },
        ],

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        itemTotal: {
          type: Number,
          required: true,
        },
        imageUrl: String,
        gstPercent: {
          type: Number,
          default: 0,
        },
      },
    ],

    // Pricing Breakdown
    pricing: {
      subtotal: {
        type: Number,
        required: true,
      },
      totalTax: {
        type: Number,
        required: true,
        default: 0,
      },
      deliveryFee: {
        type: Number,
        default: 0,
      },
      platformFee: {
        type: Number,
        default: 0,
      },
      discountAmount: {
        type: Number,
        default: 0,
      },
      grandTotal: {
        type: Number,
        required: true,
      },
    },

    // Payment Summary (Reference to Transaction)
    payment: {
      method: {
        type: String,
        enum: ["cod", "online"],
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      totalAmount: {
        type: Number,
        required: true,
      },
      paidAmount: {
        type: Number,
        default: 0,
      },
      pendingAmount: {
        type: Number,
        required: true,
      },
      transactionIds: [String], // Array of transaction references
    },

    // Order Status
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "out-for-delivery",
        "delivered",
        "completed",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    // Status History
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: String,
          enum: ["customer", "store", "system"],
          required: true,
        },
        notes: String,
      },
    ],

    // Special Instructions
    specialInstructions: String,

    // Timestamps
    placedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    cancelledAt: Date,
    cancellationReason: String,

    // Metadata
    isReviewed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Indexes for performance
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ storeId: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

// GeoJSON index for delivery address
orderSchema.index({ "deliveryAddress.location": "2dsphere" });

module.exports = mongoose.model("Order", orderSchema);
