const mongoose = require("mongoose");

const LoyaltyCardSchema = new mongoose.Schema(
    {
        cardId: {
            type: String,
            required: true,
            unique: true
        },
        cardType: {
            type: String,
            default: "Standard"
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer"
        },
        pointsBalance: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        },
        issuedAt: {
            type: Date,
            default: Date.now
        },
        lastUsedAt: {
            type: Date
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("LoyaltyCard", LoyaltyCardSchema);
