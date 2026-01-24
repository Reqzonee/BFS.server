const mongoose = require("mongoose");

const StoreAddOnGroupConfigSchema = new mongoose.Schema(
    {
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StoreMaster",
            required: true,
        },
        addOnGroupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AddOnGroupMaster",
            required: true,
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        customMinSelection: {
            type: Number,
            default: null, // If null, use minSelection from AddOnGroupMaster
        },
        customMaxSelection: {
            type: Number,
            default: null, // If null, use maxSelection from AddOnGroupMaster
        },
    },
    { timestamps: true }
);

// Compound index to ensure one config per add-on group per store
StoreAddOnGroupConfigSchema.index({ storeId: 1, addOnGroupId: 1 }, { unique: true });

module.exports = mongoose.model("StoreAddOnGroupConfig", StoreAddOnGroupConfigSchema);
