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
        }
    },
    { timestamps: true }
);

// Compound index to ensure one config per merchandise per store
StoreMerchandiseConfigSchema.index({ storeId: 1, merchandiseId: 1 }, { unique: true });

module.exports = mongoose.model("StoreMerchandiseConfig", StoreMerchandiseConfigSchema);
