const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        mobileNumber: { type: String, required: true },
        walletPoints: { type: Number, default: 0 },
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: "StoreMaster" },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Customer", CustomerSchema);
