const mongoose = require("mongoose");

const CategoryMasterSchema = new mongoose.Schema(
    {
        categoryName: {
            type: String,
            required: true,
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CompanyMaster",
            required: true
        },
        type: {
            type: String,
            enum: ['FOOD', 'MERCH'],
            required: true,
        },
        displayOrder: {
            type: Number,
            default: 0,
        },
        imageUrl: {
            type: String,
            default: "",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("CategoryMaster", CategoryMasterSchema);
