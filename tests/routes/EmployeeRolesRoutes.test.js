const request = require("supertest");
const express = require("express");
const router = require("../../routes/EmployeeRolesRoutes");

jest.mock("../../controllers/EmployeeRolesController", () => ({
  createEmployeeRoles: jest.fn((req, res) =>
    res.status(201).json({ message: "EmployeeRoles created" }),
  ),
  getEmployeeRoles: jest.fn((req, res) =>
    res.status(200).json({ message: "EmployeeRoles found" }),
  ),
  updateEmployeeRoles: jest.fn((req, res) =>
    res.status(200).json({ message: "EmployeeRoles updated" }),
  ),
}));

jest.mock("../../middlewares/authMiddleware", () => ({
  authMiddleware: jest.fn(() => (req, res, next) => next()),
}));

const app = express();
app.use(express.json());
app.use("/api", router);

describe("EmployeeRoles Routes", () => {
  it("should create employee roles", async () => {
    const res = await request(app)
      .post("/api/auth/create/employee-roles")
      .send({ name: "test" });
    expect(res.statusCode).toEqual(201);
  });

  it("should get employee roles", async () => {
    const res = await request(app).get("/api/auth/get/employee-roles/1");
    expect(res.statusCode).toEqual(200);
  });

  it("should update employee roles", async () => {
    const res = await request(app)
      .put("/api/auth/update/employee-roles/1")
      .send({ name: "test" });
    expect(res.statusCode).toEqual(200);
  });
});
