const mongoose = require("mongoose");

const StoreComboConfigSchema = new mongoose.Schema(
    {
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StoreMaster",
            required: true,
        },
        comboId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ComboMaster",
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
    },
    { timestamps: true }
);

// Compound index to ensure one config per combo per store
StoreComboConfigSchema.index({ storeId: 1, comboId: 1 }, { unique: true });

module.exports = mongoose.model("StoreComboConfig", StoreComboConfigSchema);
