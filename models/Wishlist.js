const mongoose = require("mongoose");

const wishlistItemSchema = new mongoose.Schema({
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
    imageUrl: { type: String },
    basePrice: { type: Number },
    addedAt: { type: Date, default: Date.now }
}, { _id: true });

const WishlistSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
            unique: true,
            index: true
        },
        items: [wishlistItemSchema]
    },
    { timestamps: true }
);

module.exports = mongoose.model("Wishlist", WishlistSchema);
