const CategoryMaster = require("../../models/CategoryMaster.js");
const SubCategoryMaster = require("../../models/SubCategoryMaster.js");
const FoodItemMaster = require("../../models/FoodItemMaster.js");
const MerchandiseMaster = require("../../models/MerchandiseMaster.js");
const ComboMaster = require("../../models/ComboMaster.js");
const AddOnGroupMaster = require("../../models/AddOnGroupMaster.js");
const AddOnMaster = require("../../models/AddOnMaster.js");
const StoreCategoryConfig = require("../../models/StoreCategoryConfig.js");
const StoreItemConfig = require("../../models/StoreItemConfig.js");
const StoreMerchandiseConfig = require("../../models/StoreMerchandiseConfig.js");
const StoreComboConfig = require("../../models/StoreComboConfig.js");

const getStoreMenu = async (req, res) => {
  try {
    const { storeId } = req.params;

    const foodCategories = await CategoryMaster.find({ type: "FOOD", isActive: true });

    const menu = [];

    for (const category of foodCategories) {
      const categoryConfig = await StoreCategoryConfig.findOne({
        storeId,
        categoryId: category._id,
      });

      if (!categoryConfig || !categoryConfig.isAvailable) {
        continue;
      }

      const foodItems = await FoodItemMaster.find({
        categoryId: category._id,
        isActive: true,
      });

      const availableItems = [];

      for (const item of foodItems) {
        const itemConfig = await StoreItemConfig.findOne({
          storeId,
          itemId: item._id,
        });

        if (!itemConfig || !itemConfig.isAvailable) {
          continue;
        }

        const subCategories = [];
        if (item.subCategoryIds && item.subCategoryIds.length > 0) {
          const subCategoryDocs = await SubCategoryMaster.find({
            _id: { $in: item.subCategoryIds },
            isActive: true,
          });

          for (const subCat of subCategoryDocs) {
            subCategories.push({
              _id: subCat._id,
              subCategoryName: subCat.subCategoryName,
              subCategoryCode: subCat.subCategoryCode,
              options: subCat.options || [],
              isActive: subCat.isActive,
            });
          }
        }

        const addOnGroups = [];
        if (item.addOnGroupIds && item.addOnGroupIds.length > 0) {
          const addOnGroupDocs = await AddOnGroupMaster.find({
            _id: { $in: item.addOnGroupIds },
            isActive: true,
          });

          for (const group of addOnGroupDocs) {
            const addOns = await AddOnMaster.find({
              addOnGroupId: group._id,
              isActive: true,
            });

            addOnGroups.push({
              _id: group._id,
              groupName: group.groupName,
              groupDescription: group.groupDescription,
              isRequired: group.isRequired,
              minSelection: group.minSelection,
              maxSelection: group.maxSelection,
              addOns: addOns.map((addon) => ({
                _id: addon._id,
                title: addon.title,
                description: addon.description,
                price: addon.price,
                imageUrl: addon.imageUrl,
                isActive: addon.isActive,
              })),
            });
          }
        }

        const itemPrice = itemConfig.customPrice || item.basePrice;

        const availableCombinations = [];
        if (item.variants && item.variants.length > 0) {
          for (const variant of item.variants) {
            if (variant.isActive) {
              const combinationObj = {};
              if (variant.combination) {
                variant.combination.forEach((value, key) => {
                  combinationObj[key] = value;
                });
              }
              availableCombinations.push({
                combination: combinationObj,
                price: variant.price,
                itemCode: variant.itemCode,
                isVeg: variant.isVeg,
              });
            }
          }
        }

        availableItems.push({
          _id: item._id,
          itemName: item.itemName,
          itemCode: item.itemCode,
          description: item.description,
          basePrice: itemPrice,
          gstPercent: item.gstPercent,
          imageUrl: item.imageUrl,
          isVeg: item.isVeg,
          isAvailable: itemConfig.isAvailable,
          isSoldOut: itemConfig.isSoldOut || false,
          subCategories,
          availableCombinations,
          addOnGroups,
        });
      }

      if (availableItems.length > 0) {
        menu.push({
          _id: category._id,
          categoryName: category.categoryName,
          categoryCode: category.categoryCode,
          description: category.description,
          iconUrl: category.iconUrl,
          items: availableItems,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Food menu fetched successfully",
      status: 200,
      data: {
        menu,
        categoryCount: menu.length,
      },
    });
  } catch (error) {
    console.error("Get Store Menu Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch store menu",
      error: error.message,
      status: 500,
    });
  }
};

const getMerchandise = async (req, res) => {
  try {
    const { storeId } = req.params;

    const merchandiseCategories = await CategoryMaster.find({
      type: "MERCHANDISE",
      isActive: true,
    });

    const merchandise = [];

    for (const category of merchandiseCategories) {
      const categoryConfig = await StoreCategoryConfig.findOne({
        storeId,
        categoryId: category._id,
      });

      if (!categoryConfig || !categoryConfig.isAvailable) {
        continue;
      }

      const merchandiseItems = await MerchandiseMaster.find({
        categoryId: category._id,
        isActive: true,
      });

      const availableItems = [];

      for (const item of merchandiseItems) {
        const itemConfig = await StoreMerchandiseConfig.findOne({
          storeId,
          merchandiseId: item._id,
        });

        if (itemConfig && itemConfig.isSoldOut) {
          continue;
        }

        const subCategories = [];
        if (item.subCategoryIds && item.subCategoryIds.length > 0) {
          const subCategoryDocs = await SubCategoryMaster.find({
            _id: { $in: item.subCategoryIds },
            isActive: true,
          });

          for (const subCat of subCategoryDocs) {
            subCategories.push({
              _id: subCat._id,
              subCategoryName: subCat.subCategoryName,
              subCategoryCode: subCat.subCategoryCode,
              options: subCat.options || [],
              isActive: subCat.isActive,
            });
          }
        }

        const availableCombinations = [];
        if (item.variants && item.variants.length > 0) {
          for (const variant of item.variants) {
            if (variant.isActive) {
              const combinationObj = {};
              if (variant.combination) {
                variant.combination.forEach((value, key) => {
                  combinationObj[key] = value;
                });
              }
              availableCombinations.push({
                combination: combinationObj,
                price: variant.price,
                itemCode: variant.itemCode,
              });
            }
          }
        }

        availableItems.push({
          _id: item._id,
          productName: item.productName,
          sku: item.sku,
          description: item.description,
          basePrice: item.basePrice,
          gstPercent: item.gstPercent,
          imageUrls: item.imageUrls,
          isAvailable: itemConfig ? itemConfig.isAvailable : true,
          isSoldOut: itemConfig ? itemConfig.isSoldOut : false,
          subCategories,
          availableCombinations,
        });
      }

      if (availableItems.length > 0) {
        merchandise.push({
          _id: category._id,
          categoryName: category.categoryName,
          categoryCode: category.categoryCode,
          description: category.description,
          iconUrl: category.iconUrl,
          items: availableItems,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Merchandise fetched successfully",
      status: 200,
      data: {
        merchandise,
        categoryCount: merchandise.length,
      },
    });
  } catch (error) {
    console.error("Get Merchandise Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch merchandise",
      error: error.message,
      status: 500,
    });
  }
};

const getCombos = async (req, res) => {
  try {
    const { storeId } = req.params;

    const combos = await ComboMaster.find({ isActive: true });

    const availableCombos = [];

    for (const combo of combos) {
      const comboConfig = await StoreComboConfig.findOne({
        storeId,
        comboId: combo._id,
      });

      if (!comboConfig || !comboConfig.isAvailable) {
        continue;
      }

      // Skip if combo is sold out
      if (comboConfig.isSoldOut) {
        continue;
      }

      let comboIsAvailable = true;

      // Check if all food items in combo are available
      if (combo.foodItems && combo.foodItems.length > 0) {
        for (const comboItem of combo.foodItems) {
          const foodId = comboItem.foodId;
          if (!foodId) continue;

          const foodItemMaster = await FoodItemMaster.findById(foodId);
          if (!foodItemMaster || !foodItemMaster.isActive) {
            comboIsAvailable = false;
            break;
          }

          const foodItemConfig = await StoreItemConfig.findOne({
            storeId,
            itemId: foodId,
          });

          if (foodItemConfig && (!foodItemConfig.isAvailable || foodItemConfig.isSoldOut)) {
            comboIsAvailable = false;
            break;
          }
        }
      }

      if (!comboIsAvailable) {
        continue;
      }

      const comboPrice = comboConfig.customPrice || combo.price;

      availableCombos.push({
        _id: combo._id,
        comboName: combo.comboName,
        comboDescription: combo.comboDescription || combo.description,
        price: comboPrice,
        imageUrl: combo.imageUrl,
        includedItems: combo.foodItems || [],
        isAvailable: comboConfig.isAvailable,
        isSoldOut: comboConfig.isSoldOut,
        validFrom: combo.validFrom,
        validTo: combo.validTo,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Combos fetched successfully",
      status: 200,
      data: {
        combos: availableCombos,
        comboCount: availableCombos.length,
      },
    });
  } catch (error) {
    console.error("Get Combos Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch combos",
      error: error.message,
      status: 500,
    });
  }
};

const searchProducts = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { query } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
        error: "Missing query parameter",
        status: 400,
      });
    }

    const searchRegex = new RegExp(query, "i");

    const foodItems = await FoodItemMaster.find({
      $or: [
        { itemName: searchRegex },
        { itemCode: searchRegex },
        { description: searchRegex },
      ],
      isActive: true,
    });

    const availableFoodItems = [];
    for (const item of foodItems) {
      const itemConfig = await StoreItemConfig.findOne({
        storeId,
        itemId: item._id,
      });

      if (itemConfig && itemConfig.isAvailable) {
        availableFoodItems.push({
          _id: item._id,
          itemName: item.itemName,
          itemCode: item.itemCode,
          description: item.description,
          basePrice: itemConfig.customPrice || item.basePrice,
          imageUrl: item.imageUrl,
          isVeg: item.isVeg,
          type: "FoodItemMaster",
        });
      }
    }

    const merchandiseItems = await MerchandiseMaster.find({
      $or: [
        { productName: searchRegex },
        { sku: searchRegex },
        { description: searchRegex },
      ],
      isActive: true,
    });

    const availableMerchandise = [];
    for (const item of merchandiseItems) {
      const itemConfig = await StoreMerchandiseConfig.findOne({
        storeId,
        merchandiseId: item._id,
      });

      if (!itemConfig || !itemConfig.isSoldOut) {
        availableMerchandise.push({
          _id: item._id,
          productName: item.productName,
          sku: item.sku,
          description: item.description,
          basePrice: item.basePrice,
          imageUrls: item.imageUrls,
          type: "MerchandiseMaster",
        });
      }
    }

    const results = [...availableFoodItems, ...availableMerchandise];

    return res.status(200).json({
      success: true,
      message: "Search completed successfully",
      status: 200,
      data: {
        results,
        totalResults: results.length,
      },
    });
  } catch (error) {
    console.error("Search Products Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search products",
      error: error.message,
      status: 500,
    });
  }
};

module.exports = {
  getStoreMenu,
  getMerchandise,
  getCombos,
  searchProducts,
};
