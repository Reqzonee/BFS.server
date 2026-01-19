const mongoose = require("mongoose");

const AddOnGroupMasterSchema = new mongoose.Schema(
    {
        groupName: {
            type: String, // e.g., "Burger Toppings", "Pizza Crusts"
            required: true,
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CompanyMaster",
            required: true
        },
        addOnIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "AddOnMaster"
        }],
        minSelection: {
            type: Number,
            default: 0
        },
        maxSelection: {
            type: Number,
            default: 1 // 1 for radio, >1 for checkbox
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("AddOnGroupMaster", AddOnGroupMasterSchema);
