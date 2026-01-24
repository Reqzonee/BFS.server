const Cart = require("../../models/Cart.js");
const FoodItemMaster = require("../../models/FoodItemMaster.js");
const MerchandiseMaster = require("../../models/MerchandiseMaster.js");
const ComboMaster = require("../../models/ComboMaster.js");
const SubCategoryMaster = require("../../models/SubCategoryMaster.js");
const StoreItemConfig = require("../../models/StoreItemConfig.js");
const StoreMerchandiseConfig = require("../../models/StoreMerchandiseConfig.js");
const StoreComboConfig = require("../../models/StoreComboConfig.js");
const AddOnMaster = require("../../models/AddOnMaster.js");

const getCart = async (req, res) => {
  try {
    const customerId = req.customer.id;

    let cart = await Cart.findOne({ customerId })
      .populate("storeId", "storeName storeCode address contactNumber")
      .select("-__v");

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        status: 200,
        data: {
          cart: null,
          itemCount: 0,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      status: 200,
      data: {
        cart,
        itemCount: cart.items.length,
      },
    });
  } catch (error) {
    console.error("Get Cart Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: error.message,
      status: 500,
    });
  }
};

const addItemToCart = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { storeId, itemId, itemType, selectedCombination, addOns, quantity } = req.body;

    if (!storeId || !itemId || !itemType || !quantity) {
      return res.status(400).json({
        success: false,
        message: "storeId, itemId, itemType, and quantity are required",
        error: "Missing required fields",
        status: 400,
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
        error: "Invalid quantity",
        status: 400,
      });
    }

    let item;
    let storeConfig;
    let itemName;
    let itemCode;
    let basePrice;
    let imageUrl;
    let gstPercent = 0;
    let selectedVariant = null;

    if (itemType === "FoodItemMaster") {
      item = await FoodItemMaster.findById(itemId);
      storeConfig = await StoreItemConfig.findOne({ storeId, itemId });

      if (!item || !item.isActive) {
        return res.status(404).json({
          success: false,
          message: "Food item not found or inactive",
          error: "Item not available",
          status: 404,
        });
      }

      if (!storeConfig || !storeConfig.isAvailable) {
        return res.status(400).json({
          success: false,
          message: "Item not available at this store",
          error: "Item not available",
          status: 400,
        });
      }

      if (storeConfig.isSoldOut) {
        return res.status(400).json({
          success: false,
          message: "Item is currently sold out",
          error: "Item sold out",
          status: 400,
        });
      }

      itemName = item.itemName;
      itemCode = item.itemCode;
      basePrice = storeConfig.customPrice || item.basePrice;
      imageUrl = item.imageUrl;
      gstPercent = item.gstPercent;

      let combinationToUse = selectedCombination;

      if (!combinationToUse && item.subCategoryIds && item.subCategoryIds.length > 0 && item.variants && item.variants.length > 0) {
        const subCategories = await SubCategoryMaster.find({
          _id: { $in: item.subCategoryIds },
          isActive: true
        });

        const defaultCombination = {};
        for (const subCat of subCategories) {
          if (subCat.options && subCat.options.length > 0) {
            const sortedOptions = subCat.options.sort((a, b) => a.displayOrder - b.displayOrder);
            defaultCombination[subCat.name] = sortedOptions[0].name;
          }
        }

        if (Object.keys(defaultCombination).length > 0) {
          combinationToUse = defaultCombination;
        }
      }

      if (combinationToUse && item.variants && item.variants.length > 0) {
        const combinationString = JSON.stringify(combinationToUse);
        const matchedVariant = item.variants.find(v => {
          const variantCombination = {};
          if (v.combination) {
            v.combination.forEach((value, key) => {
              variantCombination[key] = value;
            });
          }
          return JSON.stringify(variantCombination) === combinationString;
        });

        if (matchedVariant && matchedVariant.isActive) {
          selectedVariant = {
            combination: combinationToUse,
            price: matchedVariant.price,
            itemCode: matchedVariant.itemCode
          };
          basePrice = matchedVariant.price;
        }
      }

    } else if (itemType === "MerchandiseMaster") {
      item = await MerchandiseMaster.findById(itemId);
      storeConfig = await StoreMerchandiseConfig.findOne({ storeId, merchandiseId: itemId });

      if (!item || !item.isActive) {
        return res.status(404).json({
          success: false,
          message: "Merchandise not found or inactive",
          error: "Item not available",
          status: 404,
        });
      }

      if (storeConfig && storeConfig.isSoldOut) {
        return res.status(400).json({
          success: false,
          message: "Merchandise is sold out",
          error: "Item sold out",
          status: 400,
        });
      }

      itemName = item.productName;
      itemCode = item.sku;
      basePrice = item.basePrice;
      imageUrl = item.imageUrls && item.imageUrls[0];
      gstPercent = item.gstPercent;

      let combinationToUse = selectedCombination;

      if (!combinationToUse && item.subCategoryIds && item.subCategoryIds.length > 0 && item.variants && item.variants.length > 0) {
        const subCategories = await SubCategoryMaster.find({
          _id: { $in: item.subCategoryIds },
          isActive: true
        });

        const defaultCombination = {};
        for (const subCat of subCategories) {
          if (subCat.options && subCat.options.length > 0) {
            const sortedOptions = subCat.options.sort((a, b) => a.displayOrder - b.displayOrder);
            defaultCombination[subCat.name] = sortedOptions[0].name;
          }
        }

        if (Object.keys(defaultCombination).length > 0) {
          combinationToUse = defaultCombination;
        }
      }

      if (combinationToUse && item.variants && item.variants.length > 0) {
        const combinationString = JSON.stringify(combinationToUse);
        const matchedVariant = item.variants.find(v => {
          const variantCombination = {};
          if (v.combination) {
            v.combination.forEach((value, key) => {
              variantCombination[key] = value;
            });
          }
          return JSON.stringify(variantCombination) === combinationString;
        });

        if (matchedVariant && matchedVariant.isActive) {
          selectedVariant = {
            combination: combinationToUse,
            price: matchedVariant.price,
            itemCode: matchedVariant.itemCode
          };
          basePrice = matchedVariant.price;
        }
      }

    } else if (itemType === "ComboMaster") {
      item = await ComboMaster.findById(itemId);
      storeConfig = await StoreComboConfig.findOne({ storeId, comboId: itemId });

      if (!item || !item.isActive) {
        return res.status(404).json({
          success: false,
          message: "Combo not found or inactive",
          error: "Item not available",
          status: 404,
        });
      }

      if (!storeConfig || !storeConfig.isAvailable) {
        return res.status(400).json({
          success: false,
          message: "Combo not available at this store",
          error: "Item not available",
          status: 400,
        });
      }

      if (storeConfig.isSoldOut) {
        return res.status(400).json({
          success: false,
          message: "Combo is currently sold out",
          error: "Item sold out",
          status: 400,
        });
      }

      itemName = item.comboName;
      itemCode = null;
      basePrice = storeConfig.customPrice || item.price;
      imageUrl = item.imageUrl;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid item type",
        error: "Invalid item type",
        status: 400,
      });
    }

    let cart = await Cart.findOne({ customerId });

    if (cart && cart.storeId.toString() !== storeId) {
      return res.status(400).json({
        success: false,
        message: "Cart contains items from another store. Please clear cart first.",
        error: "Store mismatch",
        status: 400,
        data: {
          currentStoreId: cart.storeId,
        },
      });
    }

    const processedAddOns = [];
    let addOnsTotal = 0;

    if (itemType === "FoodItemMaster" && addOns && Array.isArray(addOns)) {
      for (const addon of addOns) {
        const addOnItem = await AddOnMaster.findById(addon.addOnId);
        if (addOnItem && addOnItem.isActive) {
          processedAddOns.push({
            addOnId: addon.addOnId,
            addOnName: addOnItem.title,
            price: addOnItem.price,
            quantity: addon.quantity || 1,
          });
          addOnsTotal += addOnItem.price * (addon.quantity || 1);
        }
      }
    }

    const itemTotal = (basePrice + addOnsTotal) * quantity;

    const cartItem = {
      itemId,
      itemType,
      itemName,
      itemCode,
      basePrice,
      selectedVariant,
      addOns: processedAddOns,
      quantity,
      itemTotal,
      imageUrl,
      gstPercent,
    };

    if (!cart) {
      cart = new Cart({
        customerId,
        storeId,
        items: [cartItem],
      });
    } else {
      const existingItemIndex = cart.items.findIndex(
        (i) => {
          if (i.itemId.toString() !== itemId) return false;
          if (i.itemType !== itemType) return false;
          
          const existingCombination = i.selectedVariant?.combination ? 
            JSON.stringify(Object.fromEntries(i.selectedVariant.combination)) : null;
          const newCombination = selectedCombination ? 
            JSON.stringify(selectedCombination) : null;
          
          if (existingCombination !== newCombination) return false;
          
          const existingAddOns = JSON.stringify(i.addOns.map(a => ({
            id: a.addOnId.toString(),
            qty: a.quantity
          })).sort((a, b) => a.id.localeCompare(b.id)));
          
          const newAddOns = JSON.stringify(processedAddOns.map(a => ({
            id: a.addOnId.toString(),
            qty: a.quantity
          })).sort((a, b) => a.id.localeCompare(b.id)));
          
          return existingAddOns === newAddOns;
        }
      );

      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += quantity;
        const addOnsSum = cart.items[existingItemIndex].addOns.reduce(
          (sum, a) => sum + a.price * a.quantity,
          0
        );
        cart.items[existingItemIndex].itemTotal =
          (cart.items[existingItemIndex].basePrice + addOnsSum) *
          cart.items[existingItemIndex].quantity;
      } else {
        cart.items.push(cartItem);
      }
    }

    cart.calculateTotals();
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
      status: 200,
      data: {
        cart,
        itemCount: cart.items.length,
      },
    });
  } catch (error) {
    console.error("Add Item to Cart Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add item to cart",
      error: error.message,
      status: 500,
    });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
        error: "Invalid quantity",
        status: 400,
      });
    }

    const cart = await Cart.findOne({ customerId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
        error: "Cart not found",
        status: 404,
      });
    }

    const cartItem = cart.items.id(cartItemId);

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
        error: "Item not found",
        status: 404,
      });
    }

    cartItem.quantity = quantity;
    const addOnsTotal = cartItem.addOns.reduce((sum, a) => sum + a.price * a.quantity, 0);
    cartItem.itemTotal = (cartItem.basePrice + addOnsTotal) * quantity;

    cart.calculateTotals();
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      status: 200,
      data: {
        cart,
        itemCount: cart.items.length,
      },
    });
  } catch (error) {
    console.error("Update Cart Item Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update cart item",
      error: error.message,
      status: 500,
    });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { cartItemId } = req.params;

    const cart = await Cart.findOne({ customerId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
        error: "Cart not found",
        status: 404,
      });
    }

    const cartItem = cart.items.id(cartItemId);

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
        error: "Item not found",
        status: 404,
      });
    }

    cartItem.deleteOne();

    if (cart.items.length === 0) {
      await Cart.deleteOne({ customerId });
      return res.status(200).json({
        success: true,
        message: "Cart is now empty",
        status: 200,
        data: {
          cart: null,
          itemCount: 0,
        },
      });
    }

    cart.calculateTotals();
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
      status: 200,
      data: {
        cart,
        itemCount: cart.items.length,
      },
    });
  } catch (error) {
    console.error("Remove Cart Item Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove item from cart",
      error: error.message,
      status: 500,
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const customerId = req.customer.id;

    await Cart.deleteOne({ customerId });

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      status: 200,
      data: {
        cart: null,
        itemCount: 0,
      },
    });
  } catch (error) {
    console.error("Clear Cart Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message,
      status: 500,
    });
  }
};

module.exports = {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
