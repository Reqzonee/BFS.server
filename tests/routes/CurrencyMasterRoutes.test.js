const request = require("supertest");
const express = require("express");
const router = require("../../routes/CurrencyMasterRoutes");
const CurrencyMaster = require("../../models/CurrencyMaster");
const {
  getReferencingCounts,
  formatReferenceMessage,
} = require("../../utils/referenceHelper");

// Mock dependencies
jest.mock("../../models/CurrencyMaster");
jest.mock("../../utils/referenceHelper");
jest.mock("../../middlewares/authMiddleware", () => ({
  authMiddleware: jest.fn(() => (req, res, next) => next()),
}));

const app = express();
app.use(express.json());
app.use("/api", router);

describe("CurrencyMaster Routes - Comprehensive Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  //--- createCurrencyMaster ---
  describe("POST /auth/create/currency", () => {
    it("should create a currency successfully", async () => {
      CurrencyMaster.findOne.mockResolvedValue(null);
      const mockSave = jest.fn().mockResolvedValue(true);
      CurrencyMaster.prototype.save = mockSave;

      const res = await request(app).post("/api/auth/create/currency").send({
        currencyName: "US Dollar",
        currencyCode: "USD",
        currencySymbol: "$",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("Currency created successfully");
      expect(mockSave).toHaveBeenCalled();
    });

    it("should return 400 if currency name already exists", async () => {
      CurrencyMaster.findOne.mockResolvedValue({ currencyName: "US Dollar" });
      const res = await request(app).post("/api/auth/create/currency").send({
        currencyName: "US Dollar",
        currencyCode: "USD",
        currencySymbol: "$",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Currency with this name already exists");
    });

    it("should return 400 if currency code already exists", async () => {
      CurrencyMaster.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ currencyCode: "USD" });
      const res = await request(app).post("/api/auth/create/currency").send({
        currencyName: "US Dollar",
        currencyCode: "USD",
        currencySymbol: "$",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Currency with this code already exists");
    });
  });

  //--- getCurrencyMasterById ---
  describe("GET /auth/get/currency/:id", () => {
    it("should get a currency by id successfully", async () => {
      CurrencyMaster.findById.mockResolvedValue({
        _id: "1",
        currencyName: "US Dollar",
      });
      const res = await request(app).get("/api/auth/get/currency/1");
      expect(res.statusCode).toBe(200);
      expect(res.body.data.currencyName).toBe("US Dollar");
    });

    it("should return 404 if currency not found", async () => {
      CurrencyMaster.findById.mockResolvedValue(null);
      const res = await request(app).get("/api/auth/get/currency/999");
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Currency not found");
    });
  });

  //--- deleteCurrencyMaster ---
  describe("DELETE /auth/delete/currency/:id", () => {
    it("should delete a currency successfully", async () => {
      getReferencingCounts.mockResolvedValue({ totalReferences: 0 });
      CurrencyMaster.findByIdAndDelete.mockResolvedValue({ _id: "1" });

      const res = await request(app).delete("/api/auth/delete/currency/1");
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Currency deleted successfully");
    });

    it("should return 409 if currency is in use", async () => {
      getReferencingCounts.mockResolvedValue({ totalReferences: 1 });
      formatReferenceMessage.mockReturnValue("Formatted message");
      const res = await request(app).delete("/api/auth/delete/currency/1");
      expect(res.statusCode).toBe(409);
      expect(res.body.message).toContain("Cannot delete Currency");
    });

    it("should return 404 if currency to delete is not found", async () => {
      getReferencingCounts.mockResolvedValue({ totalReferences: 0 });
      CurrencyMaster.findByIdAndDelete.mockResolvedValue(null);
      const res = await request(app).delete("/api/auth/delete/currency/999");
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Currency not found");
    });
  });
});
