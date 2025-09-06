const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware.js");
const {
    createRole,
    listAllRoles,
    updateRole,
    deleteRole,
    getRoleById,
    listRoleByParams,
} = require("../controllers/RoleMasterController.js");

router.post(
    "/auth/create/roles",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    createRole
);

router.get(
    "/auth/list/roles",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    listAllRoles
);

router.put("/auth/update/role/:roleId", authMiddleware(["ADMIN","EMPLOYEE"]), updateRole);

router.delete(
    "/auth/delete/roles/:roleId",
    authMiddleware(["ADMIN","EMPLOYEE"]),
    deleteRole
);

router.get(
    "/auth/get/roles/:roleId",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    getRoleById
);

router.post(
    "/auth/listbyparams/roles",
    authMiddleware(["ADMIN","EMPLOYEE"]),
    listRoleByParams
);

module.exports = router;
