const mongoose = require("mongoose");

const CurrencyMasterSchema = new mongoose.Schema(
    {
        currencyName: {
            type: String,
            required: true,
            trim: true,
        },
        currencyCode: {
            type: String,
            required: true,
            trim: true,
        },
        currencySymbol: {
            type: String,
            required: true,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("CurrencyMaster", CurrencyMasterSchema);
