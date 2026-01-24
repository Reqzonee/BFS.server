const StoreItemConfig = require("../../models/StoreItemConfig.js");
const FoodItemMaster = require("../../models/FoodItemMaster.js");
const StoreMaster = require("../../models/StoreMaster.js");
const ComboMaster = require("../../models/ComboMaster.js");
const StoreComboConfig = require("../../models/StoreComboConfig.js");
const StoreAddOnConfig = require("../../models/StoreAddOnConfig.js");
const AddOnMaster = require("../../models/AddOnMaster.js");
const StoreCategoryConfig = require("../../models/StoreCategoryConfig.js");
const CategoryMaster = require("../../models/CategoryMaster.js");

// Get Store Menu (Merged View: Master + Config)
const getStoreMenu = async (req, res) => {
    try {
        const { storeId } = req.params;

        // Validate store exists
        const store = await StoreMaster.findOne({ _id: storeId });
        if (!store) {
            return res.status(404).json({ isOk: false, message: "Store not found" });
        }

        const companyId = store.companyId;

        // --- FOOD ITEMS ---
        const masterItems = await FoodItemMaster.find({ companyId, isActive: true }).populate("categoryId").lean();
        const storeConfigs = await StoreItemConfig.find({ storeId }).lean();

        const configMap = new Map();
        storeConfigs.forEach(config => {
            configMap.set(config.itemId.toString(), config);
        });

        const items = masterItems.map(item => {
            const config = configMap.get(item._id.toString());

            let mergedVariants = item.variants || [];
            if (config && config.variantConfig && item.variants) {
                const variantConfigMap = new Map();
                config.variantConfig.forEach(vc => variantConfigMap.set(vc.variantKey, vc.isAvailable));

                mergedVariants = item.variants.map(v => {
                    const key = v._id.toString();
                    // For store view, isActive reflects availability in store
                    const available = variantConfigMap.has(key) ? variantConfigMap.get(key) : true;
                    // Use lean() so we can modify properties directly
                    return { ...v, isActive: available };
                });
            }

            return {
                ...item,
                isAvailable: config ? config.isAvailable : true,
                price: (config && config.customPrice) ? config.customPrice : item.basePrice,
                isCustomPrice: (config && config.customPrice) ? true : false,
                configId: config ? config._id : null,
                variants: mergedVariants
            };
        });

        // --- COMBOS ---
        const masterCombos = await ComboMaster.find({ companyId, isActive: true })
            .populate("foodItems.foodId")
            .lean();
        const comboConfigs = await StoreComboConfig.find({ storeId }).lean();

        const comboConfigMap = new Map();
        comboConfigs.forEach(config => {
            configMap.set(config.comboId.toString(), config); // Fix: use distinct map or clearer variable if needed, but separate loops are fine
            // actually I reused configMap variable name incorrectly in thought, let's use a new map or clear it? 
            // Better use new map 'comboConfigMap'
            comboConfigMap.set(config.comboId.toString(), config);
        });

        const combos = masterCombos.map(combo => {
            const config = comboConfigMap.get(combo._id.toString());
            return {
                ...combo,
                isAvailable: config ? config.isAvailable : true,
                price: (config && config.customPrice) ? config.customPrice : combo.price, // Combo matches basePrice logic but field is 'price'
                originalPrice: combo.price, // Keep original for reference
                isCustomPrice: (config && config.customPrice) ? true : false,
                configId: config ? config._id : null
            };
        });

        res.status(200).json({
            isOk: true,
            data: {
                items: items,
                combos: combos
            },
            message: "Store menu fetched successfully",
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            isOk: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Update Item Config (Toggle Availability or Set Price)
const updateStoreItemConfig = async (req, res) => {
    try {
        const { storeId, itemId } = req.params;
        let { isAvailable, customPrice, variantConfig } = req.body;

        // Security: Non-Admins cannot change price
        if (!["ADMIN", "SUPERADMIN"].includes(req.user.role)) {
            customPrice = undefined; // Ignore price updates
        }

        const config = await StoreItemConfig.findOneAndUpdate(
            { storeId, itemId },
            {
                storeId,
                itemId,
                isAvailable,
                customPrice: customPrice || null,
                variantConfig: variantConfig || []
            },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({
            isOk: true,
            data: config,
            message: "Store item config updated successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            isOk: false,
            message: "Internal server error"
        });
    }
};

// Update Combo Config
const updateStoreComboConfig = async (req, res) => {
    try {
        const { storeId, comboId } = req.params;
        let { isAvailable, customPrice } = req.body;

        // Security: Non-Admins cannot change price
        if (!["ADMIN", "SUPERADMIN"].includes(req.user.role)) {
            customPrice = undefined; // Ignore price updates
        }

        const config = await StoreComboConfig.findOneAndUpdate(
            { storeId, comboId },
            {
                storeId,
                comboId,
                isAvailable,
                customPrice: customPrice || null
            },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({
            isOk: true,
            data: config,
            message: "Store combo config updated successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            isOk: false,
            message: "Internal server error"
        });
    }
};


// Get Store AddOns (Merged View)
const getStoreAddOns = async (req, res) => {
    try {
        const { storeId } = req.params;
        const store = await StoreMaster.findOne({ _id: storeId });
        if (!store) {
            return res.status(404).json({ isOk: false, message: "Store not found" });
        }
        const companyId = store.companyId;

        const masterAddOns = await AddOnMaster.find({ companyId, isActive: true }).lean();
        const storeConfigs = await StoreAddOnConfig.find({ storeId }).lean();

        const configMap = new Map();
        storeConfigs.forEach(config => {
            configMap.set(config.addOnId.toString(), config);
        });

        const addOns = masterAddOns.map(addOn => {
            const config = configMap.get(addOn._id.toString());
            return {
                ...addOn,
                isAvailable: config ? config.isAvailable : true,
                price: (config && config.customPrice) ? config.customPrice : addOn.price,
                isCustomPrice: (config && config.customPrice) ? true : false,
                configId: config ? config._id : null
            };
        });

        res.status(200).json({
            isOk: true,
            data: addOns,
            message: "Store add-ons fetched successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

// Update AddOn Config
const updateStoreAddOnConfig = async (req, res) => {
    try {
        const { storeId, addOnId } = req.params;
        let { isAvailable, customPrice } = req.body;

        if (!["ADMIN", "SUPERADMIN"].includes(req.user.role)) {
            customPrice = undefined;
        }

        const config = await StoreAddOnConfig.findOneAndUpdate(
            { storeId, addOnId },
            {
                storeId,
                addOnId,
                isAvailable,
                customPrice: customPrice || null
            },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({
            isOk: true,
            data: config,
            message: "Store add-on config updated successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

// Get Store Categories (Merged View)
const getStoreCategories = async (req, res) => {
    try {
        const { storeId } = req.params;
        const store = await StoreMaster.findOne({ _id: storeId });
        if (!store) {
            return res.status(404).json({ isOk: false, message: "Store not found" });
        }

        // Fetch Categories (Filter by type="FOOD" to exclude Merchandise categories)
        const masterCategories = await CategoryMaster.find({ isActive: true, type: "FOOD" }).lean();
        const storeConfigs = await StoreCategoryConfig.find({ storeId }).lean();

        const configMap = new Map();
        storeConfigs.forEach(config => {
            configMap.set(config.categoryId.toString(), config);
        });

        const categories = masterCategories.map(cat => {
            const config = configMap.get(cat._id.toString());
            return {
                ...cat,
                isActive: config ? config.isAvailable : true, // Map isAvailable -> isActive for frontend compatibility or keep isAvailable
                isAvailable: config ? config.isAvailable : true,
                configId: config ? config._id : null
            };
        });

        res.status(200).json({
            isOk: true,
            data: categories,
            message: "Store categories fetched successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

// Update Store Category Config
const updateStoreCategoryConfig = async (req, res) => {
    try {
        const { storeId, categoryId } = req.params;
        const { isAvailable } = req.body; // Category config only has availability currently

        const config = await StoreCategoryConfig.findOneAndUpdate(
            { storeId, categoryId },
            {
                storeId,
                categoryId,
                isAvailable
            },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({
            isOk: true,
            data: config,
            message: "Store category availability updated successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

module.exports = {
    getStoreMenu,
    updateStoreItemConfig,
    updateStoreComboConfig,
    getStoreAddOns,
    updateStoreAddOnConfig,
    getStoreCategories,
    updateStoreCategoryConfig
};
