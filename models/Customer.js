const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
    addressType: { type: String, required: true, trim: true },
    houseNumber: { type: String, trim: true },
    street: { type: String, trim: true },
    area: { type: String, trim: true },
    landmark: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true }
    },
    isDefault: { type: Boolean, default: false }
}, { _id: true, timestamps: true });

addressSchema.index({ location: "2dsphere" });

const CustomerSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true, trim: true },
        email: { type: String, trim: true, sparse: true },
        mobileNumber: { type: String, required: true, unique: true, trim: true },
        isVerified: { type: Boolean, default: false },
        
        currentLocation: {
            latitude: { type: Number, default: 0 },
            longitude: { type: Number, default: 0 }
        },
        
        addresses: [addressSchema],
        walletPoints: { type: Number, default: 0 },
        linkedLoyaltyCards: [{ type: mongoose.Schema.Types.ObjectId, ref: "LoyaltyCard" }],
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

CustomerSchema.index({ mobileNumber: 1 });
CustomerSchema.index({ email: 1 });

CustomerSchema.pre("save", function (next) {
    if (this.isModified("addresses")) {
        const defaultAddresses = this.addresses.filter(addr => addr.isDefault);
        if (defaultAddresses.length > 1) {
            defaultAddresses.slice(1).forEach(addr => {
                addr.isDefault = false;
            });
        }
    }
    next();
});

module.exports = mongoose.model("Customer", CustomerSchema);
