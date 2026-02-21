const express = require("express");
const { authMiddleware } = require("../../middlewares/authMiddleware.js");
const { posLogin, getPOSStoreDetails } = require("../../controllers/v1/POSController.js");

const router = express.Router();

/**
 * @swagger
 * /pos/login:
 *   post:
 *     summary: POS Login with store code
 *     tags: [POS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeCode
 *             properties:
 *               storeCode:
 *                 type: string
 *                 description: Store code for POS login
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid store code
 */
router.post("/pos/login", posLogin);

/**
 * @swagger
 * /pos/store:
 *   get:
 *     summary: Get POS store details
 *     tags: [POS]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Store details
 */
router.get("/pos/store", authMiddleware(["POS"]), getPOSStoreDetails);

module.exports = router;
