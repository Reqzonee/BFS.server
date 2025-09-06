const mongoose = require("mongoose");

const CountrySchema = new mongoose.Schema(
    {
        countryName: {
            type: String,
            required: true,
            unique: true,
        },
        countryCode: {
            type: String,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: false,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Country", CountrySchema);
