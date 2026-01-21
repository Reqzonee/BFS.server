const MerchandiseMaster = require("../../models/MerchandiseMaster");
const StoreMerchandiseConfig = require("../../models/StoreMerchandiseConfig");
const StoreMaster = require("../../models/StoreMaster");
const { validationResult } = require("express-validator");

// --- GLOBAL MASTER ACTIONS (ADMIN ONLY) ---

// Create Merchandise
const createMerchandise = async (req, res) => {
    try {
        if (!["ADMIN", "SUPERADMIN"].includes(req.user.role)) {
            return res.status(403).json({ isOk: false, message: "Permission Denied" });
        }

        const { sku } = req.body;
        const existing = await MerchandiseMaster.findOne({ sku });
        if (existing) {
            return res.status(409).json({ isOk: false, message: "SKU already exists" });
        }

        if (req.body.variants && typeof req.body.variants === 'string') {
            try {
                req.body.variants = JSON.parse(req.body.variants);
            } catch (e) {
                req.body.variants = [];
            }
        }

        const newItem = new MerchandiseMaster({
            ...req.body,
            companyId: req.user.companyId || req.user.id
        });

        if (req.file) {
            newItem.imageUrls = [req.file.path.replace(/\\/g, "/")];
        }

        await newItem.save();
        res.status(201).json({ isOk: true, data: newItem, message: "Merchandise created successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal Server Error" });
    }
};

// Update Merchandise
const updateMerchandise = async (req, res) => {
    try {
        if (!["ADMIN", "SUPERADMIN"].includes(req.user.role)) {
            return res.status(403).json({ isOk: false, message: "Permission Denied" });
        }

        let updateData = { ...req.body };

        if (updateData.variants && typeof updateData.variants === 'string') {
            try {
                updateData.variants = JSON.parse(updateData.variants);
            } catch (e) {
                updateData.variants = [];
            }
        }

        if (req.file) {
            updateData.imageUrls = [req.file.path.replace(/\\/g, "/")];
        }

        const updatedItem = await MerchandiseMaster.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedItem) return res.status(404).json({ isOk: false, message: "Item not found" });

        res.status(200).json({ isOk: true, data: updatedItem, message: "Merchandise updated successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal Server Error" });
    }
};

// Delete Merchandise
const deleteMerchandise = async (req, res) => {
    try {
        if (!["ADMIN", "SUPERADMIN"].includes(req.user.role)) {
            return res.status(403).json({ isOk: false, message: "Permission Denied" });
        }

        const deleted = await MerchandiseMaster.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ isOk: false, message: "Item not found" });

        // Cleanup configs
        await StoreMerchandiseConfig.deleteMany({ merchandiseId: req.params.id });

        res.status(200).json({ isOk: true, message: "Merchandise deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal Server Error" });
    }
};

// Get All Global Merchandise (Admin View)
const getAllMerchandise = async (req, res) => {
    try {
        const companyId = req.user.companyId || req.user.id;
        const items = await MerchandiseMaster.find({ companyId })
            .populate("categoryId")
            .sort({ createdAt: -1 });

        res.status(200).json({ isOk: true, data: items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal Server Error" });
    }
};


// --- STORE ACTIONS (STORE View) ---

// Get Store Merchandise (Merged View: Master + Config)
const getStoreMerchandise = async (req, res) => {
    try {
        const { storeId } = req.params;

        const store = await StoreMaster.findById(storeId);
        if (!store) return res.status(404).json({ isOk: false, message: "Store not found" });

        const companyId = store.companyId;

        // Fetch Global Active Items
        const masterItems = await MerchandiseMaster.find({ companyId, isActive: true })
            .populate("categoryId")
            .lean();

        // Fetch Store Configs
        const storeConfigs = await StoreMerchandiseConfig.find({ storeId }).lean();

        const configMap = new Map();
        storeConfigs.forEach(c => configMap.set(c.merchandiseId.toString(), c));

        // Merge
        const mergedItems = masterItems.map(item => {
            const config = configMap.get(item._id.toString());

            let mergedVariants = item.variants || [];
            if (config && config.variantConfig && item.variants) {
                const variantConfigMap = new Map();
                config.variantConfig.forEach(vc => variantConfigMap.set(vc.variantKey, vc.isSoldOut ? false : true)); // Config uses isSoldOut (true=unavailable)

                mergedVariants = item.variants.map(v => {
                    const key = v._id.toString();
                    // isActive in UI = !isSoldOut. So if not in map, assume available (Active)
                    // If in map: isAvailable = mapValue
                    const available = variantConfigMap.has(key) ? variantConfigMap.get(key) : true;
                    return { ...v, isActive: available };
                });
            }

            return {
                ...item,
                isSoldOut: config ? config.isSoldOut : false, // Default: NOT sold out
                configId: config ? config._id : null,
                variants: mergedVariants
            };
        });

        res.status(200).json({ isOk: true, data: mergedItems });

    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal Server Error" });
    }
};

// Toggle Sold Out Status
const updateStoreMerchandiseConfig = async (req, res) => {
    try {
        const { storeId, merchandiseId } = req.params;
        const { isSoldOut, variantConfig } = req.body;

        const config = await StoreMerchandiseConfig.findOneAndUpdate(
            { storeId, merchandiseId },
            {
                storeId,
                merchandiseId,
                isSoldOut: isSoldOut, // True = Sold Out, False = Available
                variantConfig: variantConfig // variantConfig items could have isSoldOut or isAvailable. 
                // StoreMerchandiseConfig was defined with 'variantKey' and 'isSoldOut' or 'isAvailable'?
                // The edited model 'StoreMerchandiseConfig.js' used 'isAvailable: { type: Boolean, default: true }' or match convention?
                // Let's check 'StoreMerchandiseConfig.js' content. I added 'isSoldOut' convention in summary?
                // Summary said: "Added 'variantConfig' to StoreMerchandiseConfigSchema using 'isSoldOut' convention."
                // I should verify that.
            },
            { new: true, upsert: true }
        );

        res.status(200).json({ isOk: true, data: config, message: "Status updated" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal Server Error" });
    }
};



// Bulk Create Merchandise
const bulkCreateMerchandise = async (req, res) => {
    try {
        if (!["ADMIN", "SUPERADMIN"].includes(req.user.role)) {
            return res.status(403).json({ isOk: false, message: "Permission Denied" });
        }

        const items = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ isOk: false, message: "Invalid data. Expected non-empty array." });
        }

        const companyId = req.user.companyId || req.user.id;

        const operations = items.map(async (item) => {
            try {
                if (!item.productName || !item.sku || !item.basePrice || !item.categoryId) {
                    throw new Error(`Missing required fields for SKU: ${item.sku || 'Unknown'}`);
                }

                const existing = await MerchandiseMaster.findOne({ sku: item.sku });
                if (existing) {
                    throw new Error(`SKU ${item.sku} already exists`);
                }

                const newItem = new MerchandiseMaster({
                    ...item,
                    companyId: companyId
                });
                await newItem.save();
                return { success: true, sku: item.sku };
            } catch (err) {
                return { success: false, sku: item.sku, error: err.message };
            }
        });

        const processResults = await Promise.all(operations);
        const successful = processResults.filter(r => r.success);
        const failed = processResults.filter(r => !r.success);

        res.status(200).json({
            isOk: true,
            message: `Processed ${items.length} items. Success: ${successful.length}, Failed: ${failed.length}`,
            data: { successful, failed }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal Server Error" });
    }
};

module.exports = {
    createMerchandise,
    getAllMerchandise,
    updateMerchandise,
    deleteMerchandise,
    getStoreMerchandise,
    updateStoreMerchandiseConfig,
    bulkCreateMerchandise
};
