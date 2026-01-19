const mongoose = require("mongoose");

const AddOnMasterSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
            default: 0,
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CompanyMaster",
            required: true
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        imageUrl: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("AddOnMaster", AddOnMasterSchema);
