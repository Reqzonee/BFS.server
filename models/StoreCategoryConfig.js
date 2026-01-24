const mongoose = require("mongoose");

const StoreCategoryConfigSchema = new mongoose.Schema(
    {
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StoreMaster",
            required: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CategoryMaster",
            required: true,
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        displayOrder: {
            type: Number,
            default: null, // If null, use displayOrder from CategoryMaster
        },
    },
    { timestamps: true }
);

// Compound index to ensure one config per category per store
StoreCategoryConfigSchema.index({ storeId: 1, categoryId: 1 }, { unique: true });

module.exports = mongoose.model("StoreCategoryConfig", StoreCategoryConfigSchema);
