const Wishlist = require("../../models/Wishlist.js");
const FoodItemMaster = require("../../models/FoodItemMaster.js");
const MerchandiseMaster = require("../../models/MerchandiseMaster.js");
const ComboMaster = require("../../models/ComboMaster.js");

const getWishlist = async (req, res) => {
  try {
    const customerId = req.customer.id;

    let wishlist = await Wishlist.findOne({ customerId }).select("-__v");

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        message: "Wishlist is empty",
        status: 200,
        data: {
          wishlist: null,
          itemCount: 0,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Wishlist fetched successfully",
      status: 200,
      data: {
        wishlist,
        itemCount: wishlist.items.length,
      },
    });
  } catch (error) {
    console.error("Get Wishlist Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist",
      error: error.message,
      status: 500,
    });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { itemId, itemType } = req.body;

    if (!itemId || !itemType) {
      return res.status(400).json({
        success: false,
        message: "itemId and itemType are required",
        error: "Missing required fields",
        status: 400,
      });
    }

    let item;
    let itemName;
    let imageUrl;
    let basePrice;

    if (itemType === "FoodItemMaster") {
      item = await FoodItemMaster.findById(itemId);
      if (!item || !item.isActive) {
        return res.status(404).json({
          success: false,
          message: "Food item not found or inactive",
          error: "Item not available",
          status: 404,
        });
      }
      itemName = item.itemName;
      basePrice = item.basePrice;
      imageUrl = item.imageUrl;
    } else if (itemType === "MerchandiseMaster") {
      item = await MerchandiseMaster.findById(itemId);
      if (!item || !item.isActive) {
        return res.status(404).json({
          success: false,
          message: "Merchandise not found or inactive",
          error: "Item not available",
          status: 404,
        });
      }
      itemName = item.productName;
      basePrice = item.basePrice;
      imageUrl = item.imageUrls && item.imageUrls[0];
    } else if (itemType === "ComboMaster") {
      item = await ComboMaster.findById(itemId);
      if (!item || !item.isActive) {
        return res.status(404).json({
          success: false,
          message: "Combo not found or inactive",
          error: "Item not available",
          status: 404,
        });
      }
      itemName = item.comboName;
      basePrice = item.price;
      imageUrl = item.imageUrl;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid item type",
        error: "Invalid item type",
        status: 400,
      });
    }

    let wishlist = await Wishlist.findOne({ customerId });

    if (!wishlist) {
      wishlist = new Wishlist({
        customerId,
        items: [],
      });
    }

    const existingItem = wishlist.items.find(
      (i) => i.itemId.toString() === itemId
    );

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: "Item already in wishlist",
        error: "Item already exists",
        status: 400,
      });
    }

    wishlist.items.push({
      itemId,
      itemType,
      itemName,
      imageUrl,
      basePrice,
      addedAt: new Date(),
    });

    await wishlist.save();

    return res.status(201).json({
      success: true,
      message: "Item added to wishlist successfully",
      status: 201,
      data: {
        wishlist,
        itemCount: wishlist.items.length,
      },
    });
  } catch (error) {
    console.error("Add to Wishlist Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add to wishlist",
      error: error.message,
      status: 500,
    });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { wishlistItemId } = req.params;

    const wishlist = await Wishlist.findOne({ customerId });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
        error: "Wishlist not found",
        status: 404,
      });
    }

    const item = wishlist.items.id(wishlistItemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in wishlist",
        error: "Item not found",
        status: 404,
      });
    }

    item.deleteOne();

    if (wishlist.items.length === 0) {
      await Wishlist.deleteOne({ customerId });
      return res.status(200).json({
        success: true,
        message: "Wishlist is now empty",
        status: 200,
        data: {
          wishlist: null,
          itemCount: 0,
        },
      });
    }

    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: "Item removed from wishlist successfully",
      status: 200,
      data: {
        wishlist,
        itemCount: wishlist.items.length,
      },
    });
  } catch (error) {
    console.error("Remove from Wishlist Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove from wishlist",
      error: error.message,
      status: 500,
    });
  }
};

const clearWishlist = async (req, res) => {
  try {
    const customerId = req.customer.id;

    await Wishlist.deleteOne({ customerId });

    return res.status(200).json({
      success: true,
      message: "Wishlist cleared successfully",
      status: 200,
      data: {
        wishlist: null,
        itemCount: 0,
      },
    });
  } catch (error) {
    console.error("Clear Wishlist Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear wishlist",
      error: error.message,
      status: 500,
    });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
};
