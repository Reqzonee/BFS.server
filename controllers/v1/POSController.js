const StoreMasterModels = require("../../models/StoreMaster.js");
const { generateToken } = require("../../utils/generateToken.js");

/**
 * POS Login with store code
 */
const posLogin = async (req, res) => {
    try {
        const { storeCode } = req.body;

        if (!storeCode) {
            return res.status(400).json({
                isOk: false,
                message: "Store code is required",
                status: 400,
            });
        }

        // Find store by code
        const store = await StoreMasterModels.findOne({
            storeCode: storeCode.toUpperCase(),
            isActive: true,
        })
            .populate("companyId")
            .populate("countryId")
            .populate("stateId")
            .populate("cityId");

        if (!store) {
            return res.status(401).json({
                isOk: false,
                message: "Invalid store code",
                status: 401,
            });
        }

        // Check if store is accepting orders
        if (!store.isAcceptingOrders) {
            return res.status(403).json({
                isOk: false,
                message: "Store is currently not accepting orders",
                status: 403,
            });
        }

        // Generate token for POS access
        const token = await generateToken(
            store._id,
            "POS",
            store.companyId._id,
            store._id
        );

        return res.status(200).json({
            isOk: true,
            message: "Login successful",
            data: {
                store: {
                    id: store._id,
                    name: store.storeName,
                    code: store.storeCode,
                    address: store.address,
                    contactNumber: store.contactNumber,
                    gstNumber: store.gstNumber,
                },
                user: {
                    role: "POS",
                    name: `POS - ${store.storeName}`,
                },
            },
            token: token,
            status: 200,
        });
    } catch (error) {
        console.error("POS Login Error:", error);
        return res.status(500).json({
            isOk: false,
            message: error.message,
            status: 500,
        });
    }
};

/**
 * Get POS store details
 */
const getPOSStoreDetails = async (req, res) => {
    try {
        const storeId = req.user.storeId;

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
        console.error("Get Store Details Error:", error);
        return res.status(500).json({
            isOk: false,
            message: error.message,
            status: 500,
        });
    }
};

module.exports = {
    posLogin,
    getPOSStoreDetails,
};
