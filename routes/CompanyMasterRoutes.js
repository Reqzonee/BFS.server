const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const {
    createCompanyMaster,
    updateCompanyMaster,
    loginCompany,
    getCompanyMasterById
} = require("../controllers/CompanyMasterController.js");
const { authMiddleware } = require("../middlewares/authMiddleware.js");
const router = express.Router();

const logoUploadFolder = "uploads/companyMaster";

if (!fs.existsSync(logoUploadFolder)) {
    fs.mkdirSync(logoUploadFolder, { recursive: true });
}

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, logoUploadFolder);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "_" + file.originalname);
    },
});

const upload = multer({
    storage: multerStorage,
    fileFilter: (req, file, cb) => {
        if (file.fieldname === "logo") {
            if (file.mimetype.startsWith("image/")) {
                cb(null, true);
            } else {
                cb(new Error("Only image files are allowed for logo!"), false);
            }
        } else if (file.fieldname === "favicon") {
            if (file.mimetype.startsWith("image/")) {
                cb(null, true);
            } else {
                cb(new Error("Only image files are allowed for favicon!"), false);
            }
        } else {
            cb(new Error("Unknown field name!"), false);
        }
    },
});

router.post(
    "/create/company-master",
    upload.fields([
        { name: "logo", maxCount: 1 },
        { name: "favicon", maxCount: 1 },
    ]),
    createCompanyMaster
);

router.put(
    "/auth/update/company-master/:id",
    authMiddleware(["ADMIN"]),
    upload.fields([
        { name: "logo", maxCount: 1 },
        { name: "favicon", maxCount: 1 },
    ]),
    updateCompanyMaster
);

router.get(
    "/auth/get/company-master/:companyId",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    getCompanyMasterById
);

router.post("/login/company-master", loginCompany);

module.exports = router;
