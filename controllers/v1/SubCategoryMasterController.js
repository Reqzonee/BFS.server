const SubCategoryMaster = require("../../models/SubCategoryMaster.js");

// Get All SubCategories
const getAllSubCategories = async (req, res) => {
    try {
        const companyId = req.user.companyId || req.user.id;
        const { categoryId } = req.query;

        let query = { companyId };

        // If categoryId is provided, filter subCategories that include this categoryId
        if (categoryId) {
            query.categoryIds = categoryId;
        }

        const subCategories = await SubCategoryMaster.find(query).sort({ displayOrder: 1 });
        res.status(200).json({ isOk: true, data: subCategories, message: "SubCategories fetched successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

// Create SubCategory
const createSubCategory = async (req, res) => {
    try {
        const { name, categoryIds, options, displayOrder, isActive } = req.body;
        const companyId = req.user.companyId || req.user.id;

        const subCategoryData = {
            name,
            categoryIds,
            options,
            displayOrder,
            isActive: isActive !== undefined ? isActive : true,
            companyId
        };

        const subCategory = new SubCategoryMaster(subCategoryData);

        await subCategory.save();
        res.status(201).json({ isOk: true, data: subCategory, message: "SubCategory created successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

// Update SubCategory
const updateSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        const subCategory = await SubCategoryMaster.findByIdAndUpdate(id, updateData, { new: true });

        if (!subCategory) return res.status(404).json({ isOk: false, message: "SubCategory not found" });

        res.status(200).json({ isOk: true, data: subCategory, message: "SubCategory updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

// Delete SubCategory
const deleteSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const subCategory = await SubCategoryMaster.findByIdAndDelete(id);

        if (!subCategory) return res.status(404).json({ isOk: false, message: "SubCategory not found" });

        res.status(200).json({ isOk: true, message: "SubCategory deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

// Bulk Create SubCategories
const bulkCreateSubCategories = async (req, res) => {
    try {
        const items = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ isOk: false, message: "Invalid data format. Expected non-empty array." });
        }

        const companyId = req.user.companyId || req.user.id;

        const dataToInsert = items.map(item => ({
            ...item,
            companyId,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        const result = await SubCategoryMaster.insertMany(dataToInsert, { ordered: false });

        res.status(201).json({
            isOk: true,
            message: `Successfully created ${result.length} sub-categories.`,
            count: result.length
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Bulk create failed or partially failed.", error: error.message });
    }
};


module.exports = {
    getAllSubCategories,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory,
    bulkCreateSubCategories
};
