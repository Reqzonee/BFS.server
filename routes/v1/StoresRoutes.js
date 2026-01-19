const express = require("express");
const { authMiddleware  } = require("../../middlewares/authMiddleware.js");
const { createStore,
    updateStore,
    deleteStore,
    getStoreById,
    listAllStores,
    bulkCreateStores
 } = require("../../controllers/v1/StoreController.js");

const router = express.Router();

// ... existing swagger ... 

router.post(
    "/stores/bulk",
    authMiddleware(["ADMIN"]),
    bulkCreateStores
);

/**
 * @swagger
 * /stores:
 *   post:
 *     summary: Create a new store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStore'
 *     responses:
 *       201:
 *         description: Store created successfully
 *       401:
 *         description: Unauthorized
 */
router.post(
    "/stores",
    authMiddleware(["ADMIN"]),
    createStore
);

/**
 * @swagger
 * /stores:
 *   get:
 *     summary: List all stores
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of stores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isOk:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Store'
 */
router.get(
    "/stores",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    listAllStores
);

/**
 * @swagger
 * /stores/{storeId}:
 *   get:
 *     summary: Get store by ID
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Store details
 *       404:
 *         description: Store not found
 */
router.get(
    "/stores/:storeId",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    getStoreById
);

/**
 * @swagger
 * /stores/{storeId}:
 *   put:
 *     summary: Update store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStore'
 *     responses:
 *       200:
 *         description: Store updated successfully
 *       404:
 *         description: Store not found
 */
router.put(
    "/stores/:storeId",
    authMiddleware(["ADMIN"]),
    updateStore
);

/**
 * @swagger
 * /stores/{storeId}:
 *   delete:
 *     summary: Delete store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Store deleted successfully
 *       404:
 *         description: Store not found
 */
router.delete(
    "/stores/:storeId",
    authMiddleware(["ADMIN"]),
    deleteStore
);

module.exports = router;
