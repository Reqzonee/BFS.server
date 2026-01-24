const StoreMasterModels = require("../../models/StoreMaster.js");

const createStore = async (req, res) => {
    try {
        const {
            storeName,
            storeCode,
            companyId,
            address,
            countryId,
            stateId,
            cityId,
            gstNumber,
            contactNumber,
            isActive,
            latitude,
            longitude,
            deliveryRadiusKm,
            minOrderAmount,
            isAcceptingOrders,
            openingTime,
            closingTime,
        } = req.body;

        const existingStore = await StoreMasterModels.findOne({
            storeCode: storeCode,
        });

        if (existingStore) {
            return res.status(400).json({
                isOk: false,
                message: "Store code already exists",
            });
        }

        const storeData = {
            storeName,
            storeCode,
            companyId,
            address,
            countryId,
            stateId,
            cityId,
            gstNumber,
            contactNumber,
            isActive,
        };

        if (latitude !== undefined && longitude !== undefined) {
            storeData.location = {
                type: "Point",
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
            };
        }

        if (deliveryRadiusKm !== undefined) {
            storeData.deliveryRadiusKm = deliveryRadiusKm;
        }

        if (minOrderAmount !== undefined) {
            storeData.minOrderAmount = minOrderAmount;
        }

        if (isAcceptingOrders !== undefined) {
            storeData.isAcceptingOrders = isAcceptingOrders;
        }

        if (openingTime) {
            storeData.openingTime = openingTime;
        }

        if (closingTime) {
            storeData.closingTime = closingTime;
        }

        const store = new StoreMasterModels(storeData);

        await store.save();

        return res.status(201).json({
            isOk: true,
            message: "Store created successfully",
            status: 201,
        });
    } catch (error) {
        
        return res.status(500).json({
            isOk: false,
            message: error.message,
            status: 500,
        });
    }
};

const updateStore = async (req, res) => {
    try {
        const { storeId } = req.params;

        const {
            storeName,
            storeCode,
            companyId,
            address,
            countryId,
            stateId,
            cityId,
            gstNumber,
            contactNumber,
            isActive,
            latitude,
            longitude,
            deliveryRadiusKm,
            minOrderAmount,
            isAcceptingOrders,
            openingTime,
            closingTime,
        } = req.body;

        const store = await StoreMasterModels.findById(storeId);

        if (!store) {
            return res.status(404).json({
                isOk: false,
                message: "Store not found",
                status: 404,
            });
        }

        // Check uniqueness of storeCode if it's being changed
        if (storeCode && storeCode !== store.storeCode) {
            const existingStore = await StoreMasterModels.findOne({
                storeCode: storeCode,
            });
            if (existingStore) {
                return res.status(400).json({
                    isOk: false,
                    message: "Store code already exists",
                });
            }
        }

        if (storeName !== undefined) store.storeName = storeName;
        if (storeCode !== undefined) store.storeCode = storeCode;
        if (companyId !== undefined) store.companyId = companyId;
        if (address !== undefined) store.address = address;
        if (countryId !== undefined) store.countryId = countryId;
        if (stateId !== undefined) store.stateId = stateId;
        if (cityId !== undefined) store.cityId = cityId;
        if (gstNumber !== undefined) store.gstNumber = gstNumber;
        if (contactNumber !== undefined) store.contactNumber = contactNumber;
        if (isActive !== undefined) store.isActive = isActive;

        if (latitude !== undefined && longitude !== undefined) {
            store.location = {
                type: "Point",
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
            };
        }

        if (deliveryRadiusKm !== undefined) {
            store.deliveryRadiusKm = deliveryRadiusKm;
        }

        if (minOrderAmount !== undefined) {
            store.minOrderAmount = minOrderAmount;
        }

        if (isAcceptingOrders !== undefined) {
            store.isAcceptingOrders = isAcceptingOrders;
        }

        if (openingTime !== undefined) {
            store.openingTime = openingTime;
        }

        if (closingTime !== undefined) {
            store.closingTime = closingTime;
        }

        await store.save();

        return res.status(200).json({
            isOk: true,
            message: "Store updated successfully",
            status: 200,
        });
    } catch (error) {
        
        return res.status(500).json({
            isOk: false,
            message: error.message,
            status: 500,
        });
    }
};

const deleteStore = async (req, res) => {
    try {
        const { storeId } = req.params;

        const store = await StoreMasterModels.findById(storeId);

        if (!store) {
            return res.status(404).json({
                isOk: false,
                message: "Store not found",
                status: 404,
            });
        }

        // Soft delete logic can be applied here if needed, but for now hard delete
        // Or just set isActive to false?
        // Let's stick to simple delete as per pattern, or check if we should soft delete.
        // Given the pattern in employee is findByIdAndDelete, we will do the same.

        await StoreMasterModels.findByIdAndDelete(storeId);

        return res.status(200).json({
            isOk: true,
            message: "Store deleted successfully",
            status: 200,
        });
    } catch (error) {
        
        return res.status(500).json({
            isOk: false,
            message: error.message,
            status: 500,
        });
    }
};

const getStoreById = async (req, res) => {
    try {
        const { storeId } = req.params;

        const store = await StoreMasterModels.findById(storeId)
            .populate("companyId")
            .populate("countryId")
            .populate("stateId")
            .populate("cityId");

        if (!store) {
            return res.status(404).json({
                isOk: false,
                message: "Store not found",
                status: 404,
            });
        }

        return res.status(200).json({
            isOk: true,
            data: store,
            status: 200,
        });
    } catch (error) {
        
        return res.status(500).json({
            isOk: false,
            message: error.message,
            status: 500,
        });
    }
};

const listAllStores = async (req, res) => {
    try {
        // If request coming from an Admin, they can see all stores for their company (if companyId provided) or all in system (if super admin)
        // For now, list all.

        const stores = await StoreMasterModels.find({ isActive: true })
            .populate("companyId")
            .populate("countryId")
            .populate("stateId")
            .populate("cityId");

        return res.status(200).json({
            isOk: true,
            data: stores,
            status: 200,
        });
    } catch (error) {
        
        return res.status(500).json({
            isOk: false,
            message: error.message,
            status: 500,
        });
    }
};

// Bulk Create Stores
const bulkCreateStores = async (req, res) => {
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
            isActive: true, // Default to active?
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        // Insert Many
        const result = await StoreMasterModels.insertMany(dataToInsert, { ordered: false });

        res.status(201).json({
            isOk: true,
            message: `Successfully created ${result.length} stores.`,
            count: result.length
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Bulk create failed or partially failed.", error: error.message });
    }
};


module.exports = {
  createStore,
  updateStore,
  deleteStore,
  getStoreById,
  listAllStores,
  bulkCreateStores
};
