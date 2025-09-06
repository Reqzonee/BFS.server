const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware.js");
const {
    createMenuMaster,
    getAllMenuMasters,
    updateMenuMaster,
    deleteMenuMaster,
    listMenuMasterByParams,
    getMenuMasterById,
    getMenuByGroups,
    getMenuTest,
} = require("../controllers/MenuMasterController.js");

const router = express.Router();

router.post(
    "/auth/create/menu-master",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    createMenuMaster
);

router.get(
    "/auth/get/menu-master",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    getAllMenuMasters
);

router.put(
    "/auth/update/menu-master/:menuMasterId",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    updateMenuMaster
);

router.delete(
    "/auth/delete/menu-master/:menuMasterId",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    deleteMenuMaster
);

router.post(
    "/auth/listbyparams/menu-master",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    listMenuMasterByParams
);

router.get(
    "/auth/get/menu-master/:menuMasterId",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    getMenuMasterById
);

router.get(
    "/auth/get/menus-by-groups",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    getMenuByGroups
);

router.get(
    "/auth/get/menus-test",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    getMenuTest
);

module.exports = router;
