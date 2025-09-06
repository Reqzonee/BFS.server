const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware.js");
const {
    createMenuGroup,
    getAllMenuGroups,
    updateMenuGroup,
    deleteMenuGroup,
    listMenuGroupByParams,
    getMenuGroupById,
} = require("../controllers/MenuGroupController.js");

const router = express.Router();

router.post(
    "/auth/create/menu-group",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    createMenuGroup
);

router.get(
    "/auth/get/menu-group",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    getAllMenuGroups
);

router.put(
    "/auth/update/menu-group/:menuGroupId",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    updateMenuGroup
);

router.delete(
    "/auth/delete/menu-group/:menuGroupId",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    deleteMenuGroup
);

router.post(
    "/auth/listbyparams/menu-group",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    listMenuGroupByParams
);

router.get(
    "/auth/get/menu-group/:menuGroupId",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    getMenuGroupById
);

module.exports = router;
