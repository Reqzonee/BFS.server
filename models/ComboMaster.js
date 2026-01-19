const mongoose = require("mongoose");

const ComboMasterSchema = new mongoose.Schema(
    {
        comboName: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            default: "",
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CompanyMaster",
            required: true
        },
        price: {
            type: Number,
            required: true,
        },
        foodItems: [{
            foodId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "FoodItemMaster",
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                default: 1
            }
        }],
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

module.exports = mongoose.model("ComboMaster", ComboMasterSchema);
