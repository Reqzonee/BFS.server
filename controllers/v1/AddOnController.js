const AddOnMaster = require("../../models/AddOnMaster.js");
const AddOnGroupMaster = require("../../models/AddOnGroupMaster.js");


// Get All AddOns
const getAllAddOns = async (req, res) => {
    try {
        const companyId = req.user.companyId || req.user.id;
        const addOns = await AddOnMaster.find({ companyId }).sort({ createdAt: -1 });
        res.status(200).json({ isOk: true, data: addOns, message: "Add-Ons fetched successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

// Get AddOn By ID
const getAddOnById = async (req, res) => {
    try {
        const { id } = req.params;
        const addOn = await AddOnMaster.findById(id);
        if (!addOn) return res.status(404).json({ isOk: false, message: "Add-On not found" });
        res.status(200).json({ isOk: true, data: addOn, message: "Add-On fetched successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

// --- AddOn Master Operations ---

const createAddOn = async (req, res) => {
    try {
        const { title, price } = req.body;
        const companyId = req.user.companyId || req.user.id;

        const addOnData = { title, price, companyId };
        if (req.file) {
            addOnData.imageUrl = req.file.path.replace(/\\/g, "/");
        }

        const addOn = new AddOnMaster(addOnData);
        await addOn.save();

        res.status(201).json({ isOk: true, data: addOn, message: "Add-On created successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

// ... existing code ...

const updateAddOn = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        if (req.file) {
            updateData.imageUrl = req.file.path.replace(/\\/g, "/");
        }

        const addOn = await AddOnMaster.findByIdAndUpdate(id, updateData, { new: true });
        if (!addOn) return res.status(404).json({ isOk: false, message: "Add-On not found" });
        res.status(200).json({ isOk: true, data: addOn, message: "Add-On updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

const deleteAddOn = async (req, res) => {
    try {
        const { id } = req.params;
        // Check usage in groups before delete?
        const usedInGroups = await AddOnGroupMaster.exists({ addOnIds: id });
        if (usedInGroups) {
            return res.status(400).json({ isOk: false, message: "Cannot delete: This Add-On is used in groups." });
        }

        const addOn = await AddOnMaster.findByIdAndDelete(id);
        if (!addOn) return res.status(404).json({ isOk: false, message: "Add-On not found" });
        res.status(200).json({ isOk: true, message: "Add-On deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

// --- AddOn GROUP Master Operations (Included here for cohesion or separate file? Separate file is cleaner but let's keep it simple) ---
// Actually, I'll create separate controller for Groups as per earlier thought.

// Bulk Create AddOns
const bulkCreateAddOns = async (req, res) => {
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
        const result = await AddOnMaster.insertMany(dataToInsert, { ordered: false });

        res.status(201).json({
            isOk: true,
            message: `Successfully created ${result.length} add-ons.`,
            count: result.length
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Bulk create failed or partially failed.", error: error.message });
    }
};


module.exports = {
  getAllAddOns,
  getAddOnById,
  createAddOn,
  updateAddOn,
  deleteAddOn,
  bulkCreateAddOns
};
