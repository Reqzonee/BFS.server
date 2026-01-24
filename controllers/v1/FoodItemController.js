const FoodItemMaster = require("../../models/FoodItemMaster.js");
const { validationResult } = require("express-validator");



// Get all food items
const getAllFoodItems = async (req, res) => {
    try {
        const companyId = req.user.companyId || req.user.id;
        const items = await FoodItemMaster.find({ companyId }).sort({ createdAt: -1 });
        res.status(200).json({ isOk: true, data: items, message: "Food items fetched successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

// Get single food item by ID
const getFoodItemById = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await FoodItemMaster.findById(id).populate("categoryId").populate("addOnGroupIds");
        if (!item) {
            return res.status(404).json({ isOk: false, message: "Food item not found" });
        }
        res.status(200).json({ isOk: true, data: item, message: "Food item fetched successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

// Create a new food item
const createFoodItem = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ isOk: false, errors: errors.array() });
    }

    try {
        // Security Check: Only Global Admins can create Master Items
        if (!["ADMIN", "SUPERADMIN"].includes(req.user.role)) {
            return res.status(403).json({ isOk: false, message: "Permission Denied: Only Admins can modify Master List" });
        }

        const { itemName, itemCode, basePrice, category } = req.body;

        // Check if itemCode already exists for this company
        const existingItem = await FoodItemMaster.findOne({ itemCode });
        if (existingItem) {
            return res.status(409).json({
                isOk: false,
                message: "Item with this code already exists",
            });
        }

        if (req.body.variants && typeof req.body.variants === 'string') {
            try {
                req.body.variants = JSON.parse(req.body.variants);
            } catch (e) {
                req.body.variants = [];
            }
        }

        const newItem = new FoodItemMaster({
            ...req.body,
            companyId: req.user.companyId || req.user.id,
        });

        if (req.file) {
            newItem.imageUrl = req.file.path.replace(/\\/g, "/");
        }

        await newItem.save();

        res.status(201).json({
            isOk: true,
            data: newItem,
            message: "Food item created successfully",
        });
    } catch (error) {
        // ... existing catch block ...
    }
};

// ... existing code ...

// Update food item
const updateFoodItem = async (req, res) => {
    try {
        let updateData = { ...req.body };

        // Security: Non-Admins can ONLY update availability status
        if (!["ADMIN", "SUPERADMIN"].includes(req.user.role)) {
            // Filter updateData to keep only allowed fields
            const allowed = {};
            if (updateData.isActive !== undefined) allowed.isActive = updateData.isActive;
            if (updateData.isActive !== undefined) allowed.isActive = updateData.isActive;

            updateData = allowed;

            // Strict check: If they tried to upload a file, ignore it or error? 
            // Let's just ignore it to prevent crashing, effectively blocking image update.
            if (req.file) {
                // delete req.file; // Logical no-op since we don't map it to updateData
            }

            // If try to hack other fields, they are already filtered out of `updateData`
        } else {
            // Admin: Handle Image
            if (req.file) {
                updateData.imageUrl = req.file.path.replace(/\\/g, "/");
            }
            if (updateData.variants && typeof updateData.variants === 'string') {
                try {
                    updateData.variants = JSON.parse(updateData.variants);
                } catch (e) {
                    updateData.variants = [];
                }
            }
        }

        const updatedItem = await FoodItemMaster.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedItem) {
            return res.status(404).json({
                isOk: false,
                message: "Food item not found",
            });
        }

        res.status(200).json({
            isOk: true,
            data: updatedItem,
            message: "Food item updated successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            isOk: false,
            message: "Internal server error",
        });
    }
};

// Delete food item
const deleteFoodItem = async (req, res) => {
    try {
        // Security Check
        if (!["ADMIN", "SUPERADMIN"].includes(req.user.role)) {
            return res.status(403).json({ isOk: false, message: "Permission Denied: Only Admins can modify Master List" });
        }

        const deletedItem = await FoodItemMaster.findByIdAndDelete(req.params.id);
        if (!deletedItem) {
            return res.status(404).json({
                isOk: false,
                message: "Food item not found",
            });
        }

        res.status(200).json({
            isOk: true,
            message: "Food item deleted successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            isOk: false,
            message: "Internal server error, possibly due to dependencies in Store Configs or Orders.",
        });
    }
};

// Search/Filter items (good for pagination later)
const searchFoodItems = async (req, res) => {
    try {
        const { match, sorton, sortdir, skip, per_page, isActive } = req.body;
        const companyId = req.user.companyId || req.user.id;

        let query = { companyId };

        if (match) {
            query.$or = [
                { itemName: { $regex: match, $options: "i" } },
                { itemCode: { $regex: match, $options: "i" } },
                { category: { $regex: match, $options: "i" } }
            ];
        }

        if (typeof isActive !== 'undefined') {
            query.isActive = isActive;
        }

        let sort = {};
        if (sorton && sortdir) {
            sort[sorton] = sortdir === "desc" ? -1 : 1;
        } else {
            sort = { createdAt: -1 };
        }

        const items = await FoodItemMaster.find(query)
            .populate("categoryId")
            .populate("addOnGroupIds")
            .sort(sort)
            .skip(parseInt(skip) || 0)
            .limit(parseInt(per_page) || 1000);

        const count = await FoodItemMaster.countDocuments(query);

        res.status(200).json({
            isOk: true,
            data: [{ data: items, count }],
            message: "Items fetched successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal Server Error" });
    }
};

// Bulk Create Food Items
const bulkCreateFoodItems = async (req, res) => {
    try {
        const items = req.body; // Expecting array of objects
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ isOk: false, message: "Invalid data format. Expected non-empty array." });
        }

        const companyId = req.user.companyId || req.user.id;

        // Prepare data with common fields
        const dataToInsert = items.map(item => ({
            ...item,
            companyId,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        // Insert Many
        // Note: Duplicates on unique fields (itemCode) will cause errors for that document. 
        // With ordered: false, others will still proceed.
        const result = await FoodItemMaster.insertMany(dataToInsert, { ordered: false });

        res.status(201).json({
            isOk: true,
            message: `Successfully created ${result.length} food items.`,
            count: result.length
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Bulk create failed or partially failed.", error: error.message });
    }
};


module.exports = {
    getAllFoodItems,
    getFoodItemById,
    createFoodItem,
    updateFoodItem,
    deleteFoodItem,
    searchFoodItems,
    bulkCreateFoodItems
};
