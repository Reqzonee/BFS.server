const request = require("supertest");
const express = require("express");
const router = require("../../routes/EmailSetupRoutes");

jest.mock("../../controllers/EmailSetupController", () => ({
  createEmailSetup: jest.fn((req, res) =>
    res.status(201).json({ message: "EmailSetup created" }),
  ),
  updateEmailSetup: jest.fn((req, res) =>
    res.status(200).json({ message: "EmailSetup updated" }),
  ),
  getEmailSetupById: jest.fn((req, res) =>
    res.status(200).json({ message: "EmailSetup found" }),
  ),
  listAllEmailSetup: jest.fn((req, res) =>
    res.status(200).json({ message: "All email setups" }),
  ),
  deleteEmailSetup: jest.fn((req, res) =>
    res.status(200).json({ message: "EmailSetup deleted" }),
  ),
  listEmailSetupByParams: jest.fn((req, res) =>
    res.status(200).json({ message: "EmailSetups by params" }),
  ),
}));

jest.mock("../../middlewares/authMiddleware", () => ({
  authMiddleware: jest.fn(() => (req, res, next) => next()),
}));

const app = express();
app.use(express.json());
app.use("/api", router);

describe("EmailSetup Routes", () => {
  it("should create an email setup", async () => {
    const res = await request(app)
      .post("/api/auth/create/email-setup")
      .send({ name: "test" });
    expect(res.statusCode).toEqual(201);
  });

  it("should update an email setup", async () => {
    const res = await request(app)
      .put("/api/auth/update/email-setup/1")
      .send({ name: "test" });
    expect(res.statusCode).toEqual(200);
  });

  it("should get an email setup by id", async () => {
    const res = await request(app).get("/api/auth/get/email-setup/1");
    expect(res.statusCode).toEqual(200);
  });

  it("should list all email setups", async () => {
    const res = await request(app).get("/api/auth/list/email-setup");
    expect(res.statusCode).toEqual(200);
  });

  it("should delete an email setup", async () => {
    const res = await request(app).delete("/api/auth/delete/email-setup/1");
    expect(res.statusCode).toEqual(200);
  });

  it("should list email setups by params", async () => {
    const res = await request(app)
      .post("/api/auth/listbyparams/email-setup")
      .send({ name: "test" });
    expect(res.statusCode).toEqual(200);
  });
});
