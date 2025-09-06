const mongoose = require("mongoose");

const MenuGroupMasterSchema = new mongoose.Schema(
    {
        menuGroupName: {
            type: String,
            required: true,
        },
        sequence: {
            type: Number,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
            required: true,
        },
        isLink: {
            type: Boolean,
            default: false,
        },
        menuUrl: {
            type: String,
            default: "#",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("MenuGroupMaster", MenuGroupMasterSchema);
