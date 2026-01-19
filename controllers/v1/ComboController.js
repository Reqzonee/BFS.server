const ComboMaster = require("../../models/ComboMaster.js");

// Get All Combos
const getAllCombos = async (req, res) => {
    try {
        const companyId = req.user.companyId || req.user.id;
        const combos = await ComboMaster.find({ companyId }).populate("foodItems.foodId").sort({ createdAt: -1 });
        res.status(200).json({ isOk: true, data: combos, message: "Combos fetched successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

// Get Combo By ID
const getComboById = async (req, res) => {
    try {
        const { id } = req.params;
        const combo = await ComboMaster.findById(id).populate("foodItems.foodId");
        if (!combo) return res.status(404).json({ isOk: false, message: "Combo not found" });
        res.status(200).json({ isOk: true, data: combo, message: "Combo fetched successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

const createCombo = async (req, res) => {
    try {
        const { comboName, description, price, foodItems, imageUrl } = req.body;
        const companyId = req.user.companyId || req.user.id;

        let parsedFoodItems = foodItems;
        if (typeof foodItems === 'string') {
            try {
                parsedFoodItems = JSON.parse(foodItems);
            } catch (e) {
                console.error("Error parsing foodItems", e);
                parsedFoodItems = [];
            }
        }

        const comboData = {
            comboName,
            description,
            price,
            foodItems: parsedFoodItems,
            imageUrl,
            companyId
        };

        if (req.file) {
            comboData.imageUrl = req.file.path.replace(/\\/g, "/");
        }

        const combo = new ComboMaster(comboData);

        await combo.save();
        res.status(201).json({ isOk: true, data: combo, message: "Combo created successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

// ... existing code ...

const updateCombo = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        if (updateData.foodItems && typeof updateData.foodItems === 'string') {
            try {
                updateData.foodItems = JSON.parse(updateData.foodItems);
            } catch (e) {
                console.error("Error parsing foodItems", e);
                updateData.foodItems = [];
            }
        }

        if (req.file) {
            updateData.imageUrl = req.file.path.replace(/\\/g, "/");
        }

        const combo = await ComboMaster.findByIdAndUpdate(id, updateData, { new: true });
        if (!combo) return res.status(404).json({ isOk: false, message: "Combo not found" });
        res.status(200).json({ isOk: true, data: combo, message: "Combo updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

const deleteCombo = async (req, res) => {
    try {
        const { id } = req.params;
        const combo = await ComboMaster.findByIdAndDelete(id);
        if (!combo) return res.status(404).json({ isOk: false, message: "Combo not found" });
        res.status(200).json({ isOk: true, message: "Combo deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};


module.exports = {
  getAllCombos,
  getComboById,
  createCombo,
  updateCombo,
  deleteCombo
};
