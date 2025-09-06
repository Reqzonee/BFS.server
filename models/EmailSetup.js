const mongoose = require("mongoose");

const EmailSetupSchema = new mongoose.Schema(
    {
        email:{
            type: String,
            required: true,
        },
        appPassword:{
            type: String,
            required: true,
        },
        SSL:{
            type:Boolean,
            default: true,
            required: true,
        },
        port:{
            type: Number,
            required: true,
        },
        host:{
            type: String,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("EmailSetup", EmailSetupSchema);
