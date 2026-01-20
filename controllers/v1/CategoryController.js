const CategoryMaster = require("../../models/CategoryMaster.js");

// Get All Categories
const getAllCategories = async (req, res) => {
    try {
        const companyId = req.user.companyId || req.user.id;
        const { type } = req.query;

        let query = { companyId };
        if (type) {
            query.type = type;
        }

        const categories = await CategoryMaster.find(query).sort({ displayOrder: 1 });
        res.status(200).json({ isOk: true, data: categories, message: "Categories fetched successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

// Create Category
const createCategory = async (req, res) => {
    try {
        const { categoryName, type, displayOrder, imageUrl } = req.body;
        const companyId = req.user.companyId || req.user.id; // Company creating it

        const categoryData = {
            categoryName,
            type,
            displayOrder,
            imageUrl,
            companyId
        };

        if (req.file) {
            categoryData.imageUrl = req.file.path.replace(/\\/g, "/");
        }

        const category = new CategoryMaster(categoryData);

        await category.save();
        res.status(201).json({ isOk: true, data: category, message: "Category created successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

// Update Category
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        if (req.file) {
            updateData.imageUrl = req.file.path.replace(/\\/g, "/");
        }

        const category = await CategoryMaster.findByIdAndUpdate(id, updateData, { new: true });

        if (!category) return res.status(404).json({ isOk: false, message: "Category not found" });

        res.status(200).json({ isOk: true, data: category, message: "Category updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

// Delete Category
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await CategoryMaster.findByIdAndDelete(id);

        if (!category) return res.status(404).json({ isOk: false, message: "Category not found" });

        res.status(200).json({ isOk: true, message: "Category deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

// Bulk Create Categories
const bulkCreateCategories = async (req, res) => {
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

        // Insert Many (ordered: false continues even if some fail)
        const result = await CategoryMaster.insertMany(dataToInsert, { ordered: false });

        res.status(201).json({
            isOk: true,
            message: `Successfully created ${result.length} categories.`,
            count: result.length
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Bulk create failed or partially failed.", error: error.message });
    }
};


module.exports = {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    bulkCreateCategories
};
