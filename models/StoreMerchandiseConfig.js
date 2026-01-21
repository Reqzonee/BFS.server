const mongoose = require("mongoose");

const StoreMerchandiseConfigSchema = new mongoose.Schema(
    {
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StoreMaster",
            required: true,
        },
        merchandiseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MerchandiseMaster",
            required: true,
        },
        isSoldOut: {
            type: Boolean,
            default: false, // Default is NOT sold out (i.e., available)
        },
        variantConfig: [{
            variantKey: { type: String },
            isSoldOut: { type: Boolean, default: false }
        }],
    },
    { timestamps: true }
);

// Compound index to ensure one config per merchandise per store
StoreMerchandiseConfigSchema.index({ storeId: 1, merchandiseId: 1 }, { unique: true });

module.exports = mongoose.model("StoreMerchandiseConfig", StoreMerchandiseConfigSchema);
