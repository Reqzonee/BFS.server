const mongoose = require("mongoose");

const StoreItemConfigSchema = new mongoose.Schema(
    {
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StoreMaster",
            required: true,
        },
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FoodItemMaster",
            required: true,
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        isSoldOut: {
            type: Boolean,
            default: false,
        },
        customPrice: {
            type: Number,
            default: null, // If null, use basePrice from Master
        },
        variantConfig: [{
            variantKey: { type: String },
            isAvailable: { type: Boolean, default: true },
            isSoldOut: { type: Boolean, default: false }
        }],
    },
    { timestamps: true }
);

// Compound index to ensure one config per item per store
StoreItemConfigSchema.index({ storeId: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.model("StoreItemConfig", StoreItemConfigSchema);
