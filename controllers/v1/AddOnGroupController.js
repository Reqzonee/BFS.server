const AddOnGroupMaster = require("../../models/AddOnGroupMaster.js");

const createAddOnGroup = async (req, res) => {
    try {
        const { groupName, addOnIds, minSelection, maxSelection } = req.body;
        const companyId = req.user.companyId || req.user.id;

        const group = new AddOnGroupMaster({
            groupName,
            addOnIds,
            minSelection,
            maxSelection,
            companyId
        });

        await group.save();
        res.status(201).json({ isOk: true, data: group, message: "Add-On Group created successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

const getAllAddOnGroups = async (req, res) => {
    try {
        const companyId = req.user.companyId || req.user.id;
        const groups = await AddOnGroupMaster.find({ companyId, isActive: true }).populate("addOnIds");
        res.status(200).json({ isOk: true, data: groups });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

const updateAddOnGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const group = await AddOnGroupMaster.findByIdAndUpdate(id, req.body, { new: true }).populate("addOnIds");
        if (!group) return res.status(404).json({ isOk: false, message: "Add-On Group not found" });
        res.status(200).json({ isOk: true, data: group, message: "Add-On Group updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};

const deleteAddOnGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const group = await AddOnGroupMaster.findByIdAndDelete(id);
        if (!group) return res.status(404).json({ isOk: false, message: "Add-On Group not found" });
        res.status(200).json({ isOk: true, message: "Add-On Group deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};


module.exports = {
  createAddOnGroup,
  getAllAddOnGroups,
  updateAddOnGroup,
  deleteAddOnGroup
};
