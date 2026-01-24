const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "items.itemType"
    },
    itemType: {
        type: String,
        required: true,
        enum: ["FoodItemMaster", "MerchandiseMaster", "ComboMaster"]
    },
    itemName: { type: String, required: true },
    basePrice: { type: Number, required: true },
    selectedVariant: {
        combination: { type: Map, of: String },
        price: { type: Number },
        itemCode: { type: String }
    },
    addOns: [{
        addOnId: { type: mongoose.Schema.Types.ObjectId, ref: "AddOnMaster" },
        addOnName: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, default: 1 }
    }],
    quantity: { type: Number, required: true, min: 1 },
    itemTotal: { type: Number, required: true },
    imageUrl: { type: String },
    gstPercent: { type: Number, default: 0 }
}, { _id: true });

const CartSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
            index: true
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StoreMaster",
            required: true,
            index: true
        },
        items: [cartItemSchema],
        couponCode: { type: String, trim: true },
        couponDiscountAmount: { type: Number, default: 0 },
        subtotal: { type: Number, default: 0 },
        totalTax: { type: Number, default: 0 },
        cartTotal: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

CartSchema.index({ customerId: 1, storeId: 1 }, { unique: true });
CartSchema.index({ lastUpdated: 1 }, { expireAfterSeconds: 604800 });

CartSchema.methods.calculateTotals = function() {
    this.subtotal = this.items.reduce((sum, item) => sum + item.itemTotal, 0);
    this.totalTax = this.items.reduce((sum, item) => {
        const itemTaxableAmount = item.itemTotal;
        return sum + (itemTaxableAmount * (item.gstPercent / 100));
    }, 0);
    this.cartTotal = this.subtotal + this.totalTax - this.couponDiscountAmount;
    this.lastUpdated = Date.now();
};

module.exports = mongoose.model("Cart", CartSchema);
