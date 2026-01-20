const mongoose = require("mongoose");

const StoreAddOnConfigSchema = new mongoose.Schema(
    {
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StoreMaster",
            required: true,
        },
        addOnId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AddOnMaster",
            required: true,
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        customPrice: {
            type: Number,
            default: null, // If null, use price from AddOnMaster
        },
    },
    { timestamps: true }
);

// Compound index to ensure one config per add-on per store
StoreAddOnConfigSchema.index({ storeId: 1, addOnId: 1 }, { unique: true });

module.exports = mongoose.model("StoreAddOnConfig", StoreAddOnConfigSchema);
