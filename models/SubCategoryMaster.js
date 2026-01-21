const mongoose = require("mongoose");

const SubCategoryMasterSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CompanyMaster",
            required: true,
        },
        categoryIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "CategoryMaster",
        }],
        name: {
            type: String,
            required: true,
        },
        displayOrder: {
            type: Number,
            default: 0,
        },
        options: [{
            name: {
                type: String,
                required: true,
            },
            code: {
                type: String,
                default: "",
            },
            displayOrder: {
                type: Number,
                default: 0,
            }
        }],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("SubCategoryMaster", SubCategoryMasterSchema);
