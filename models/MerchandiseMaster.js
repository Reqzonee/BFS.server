const mongoose = require("mongoose");

const MerchandiseMasterSchema = new mongoose.Schema(
    {
        productName: {
            type: String,
            required: true,
        },
        sku: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
            default: "",
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CategoryMaster",
            required: true,
        },
        hsnCode: {
            type: String,
            default: "",
        },
        basePrice: {
            type: Number,
            required: true,
            default: 0,
        },
        gstPercent: {
            type: Number,
            default: 0,
        },
        imageUrls: [{
            type: String,
        }],
        isActive: {
            type: Boolean,
            default: true,
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CompanyMaster",
            required: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("MerchandiseMaster", MerchandiseMasterSchema);
