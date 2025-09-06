const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware.js");
const {
    createEmailTemplate,
    updateEmailTemplate,
    getEmailTemplateById,
    deleteEmailTemplate,
    listEmailTemplateByParams,
    listAllEmailTemplates,
} = require("../controllers/EmailTemplateController.js");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const descriptionUploadDir = "uploads/cms/email-template/signature";

if (!fs.existsSync(descriptionUploadDir)) {
    fs.mkdirSync(descriptionUploadDir, { recursive: true });
}

const descriptionImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(descriptionUploadDir)) {
            fs.mkdirSync(descriptionUploadDir, { recursive: true });
        }
        cb(null, descriptionUploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "_" + file.originalname);
    },
});

const uploadDescription = multer({
    storage: descriptionImageStorage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(
            path.extname(file.originalname).toLowerCase()
        );
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Only images (jpeg, jpg, png) are allowed!"));
    },
});

router.post(
    "/auth/create/email-template",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    createEmailTemplate
);

router.put(
    "/auth/update/email-template/:emailTemplateId",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    updateEmailTemplate
);

router.get(
    "/auth/get/email-template/:emailTemplateId",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    getEmailTemplateById
);

router.delete(
    "/auth/delete/email-template/:emailTemplateId",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    deleteEmailTemplate
);

router.post(
    "/auth/listbyparams/email-template",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    listEmailTemplateByParams
);

router.post(
    "/auth/upload-signature-image/email-template",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    uploadDescription.single("signatureImage"),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                isOk: false,
                message: "No file uploaded",
            });
        }

        // const imageUrl = `http://localhost:8000/uploads/cms/email-template/signature/${req.file.filename}`;
        const imageUrl = `https://tap.trivediassociates.co.in/uploads/cms/email-template/signature/${req.file.filename}`;

        return res.status(200).json({
            isOk: true,
            uploaded: 1,
            url: imageUrl,
            data: {
                link: imageUrl,
            },
            message: "Signature image uploaded successfully",
        });
    }
);

router.get(
    "/auth/list/email-templates",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    listAllEmailTemplates
);

module.exports = router;
