const mongoose = require("mongoose");

const FoodItemMasterSchema = new mongoose.Schema(
    {
        itemName: {
            type: String,
            required: true,
        },
        itemCode: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
            default: "",
        },
        basePrice: {
            type: Number,
            required: true,
            default: 0,
        },
        parcelCharges: {
            type: Number,
            default: 0,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CategoryMaster",
            required: true,
        },
        addOnGroupIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "AddOnGroupMaster"
        }],
        subCategoryIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubCategoryMaster"
        }],
        variants: [{
            combination: {
                type: Map,
                of: String
            },
            price: {
                type: Number,
                required: true
            },
            itemCode: {
                type: String
            },
            isVeg: {
                type: Boolean,
                default: true
            },
            isActive: {
                type: Boolean,
                default: true
            }
        }],
        gstPercent: {
            type: Number,
            default: 0
        },
        // Legacy string category removed.
        imageUrl: {
            type: String,
            default: "",
        },

        isVeg: {
            type: Boolean,
            default: true,
        },
        isFavorite: {
            type: Boolean,
            default:false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        ispackedfood: {
            type: Boolean,
            default: false,
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CompanyMaster",
            required: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("FoodItemMaster", FoodItemMasterSchema);
