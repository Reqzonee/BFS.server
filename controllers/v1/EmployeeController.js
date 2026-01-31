const EmployeeModels = require("../../models/Employee.js");
const CompanyMaster = require("../../models/CompanyMaster.js");
const { generateToken } = require("../../utils/generateToken.js");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const authService = require("../../services/authService.js");

const createEmployee = async (req, res) => {
  try {
    const {
      employeeName,
      storeId,
      roleId,
      emailOffice,
      mobileNumber,
      countryId,
      stateId,
      cityId,
      address,
      pincode,
      password,
      isActive,
    } = req.body;

    // Validation
    const errors = [];
    if (!/^\d{6}$/.test(pincode)) {
      errors.push("Pincode must be exactly 6 digits.");
    }
    if (!/^\d{10}$/.test(mobileNumber)) {
      errors.push("Mobile number must be exactly 10 digits.");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailOffice)) {
      errors.push("Invalid email address.");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        isOk: false,
        message: errors.join(" "),
        status: 400,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingEmployee = await EmployeeModels.findOne({
      emailOffice: emailOffice,
    });

    if (existingEmployee) {
      return res
        .status(400)
        .json({ isOk: false, message: "Employee already exists" });
    }

    const employee = new EmployeeModels({
      employeeName,
      storeId,
      roleId,
      emailOffice,
      mobileNumber,
      countryId,
      stateId,
      cityId,
      address,
      pincode,
      password: hashedPassword,
      isActive,
    });

    await employee.save();

    return res.status(201).json({
      isOk: true,
      message: "Employee created successfully",
      status: 201,
    });
  } catch (error) {

    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const {
      employeeName,
      storeId,
      roleId,
      emailOffice,
      mobileNumber,
      countryId,
      stateId,
      cityId,
      address,
      pincode,
      isActive,
    } = req.body;

    // Validation
    const errors = [];
    if (pincode && !/^\d{6}$/.test(pincode)) {
      errors.push("Pincode must be exactly 6 digits.");
    }
    if (mobileNumber && !/^\d{10}$/.test(mobileNumber)) {
      errors.push("Mobile number must be exactly 10 digits.");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailOffice && !emailRegex.test(emailOffice)) {
      errors.push("Invalid email address.");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        isOk: false,
        message: errors.join(" "),
        status: 400,
      });
    }

    const employee = await EmployeeModels.findById(employeeId);

    if (!employee) {
      return res.status(400).json({
        isOk: false,
        message: "Employee not found",
        status: 400,
      });
    }

    const existingEmployee = await EmployeeModels.findOne({
      emailOffice: emailOffice,
      _id: { $ne: employeeId },
    });

    if (existingEmployee) {
      return res.status(400).json({
        isOk: false,
        message: "Email already exists",
        status: 400,
      });
    }

    employee.employeeName = employeeName;
    employee.storeId = storeId;
    employee.roleId = roleId;
    employee.emailOffice = emailOffice;
    employee.mobileNumber = mobileNumber;
    employee.countryId = countryId;
    employee.stateId = stateId;
    employee.cityId = cityId;
    employee.address = address;
    employee.pincode = pincode;
    employee.isActive = isActive;

    await employee.save();

    return res.status(200).json({
      isOk: true,
      message: "Employee updated successfully",
      status: 200,
    });
  } catch (error) {

    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await EmployeeModels.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        isOk: false,
        message: "Employee not found",
        status: 404,
      });
    }

    await EmployeeModels.findByIdAndDelete(employeeId).exec();

    return res.status(200).json({
      isOk: true,
      message: "Employee deleted successfully",
      status: 200,
    });
  } catch (error) {

    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await EmployeeModels.findById(employeeId)
      .populate("storeId")
      .populate("countryId")
      .populate("stateId")
      .populate("cityId")
      .populate("roleId");

    if (!employee) {
      return res.status(404).json({
        isOk: false,
        message: "Employee not found",
        status: 404,
      });
    }

    return res.status(200).json({
      isOk: true,
      data: employee,
      status: 200,
    });
  } catch (error) {

    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

const listAllEmployees = async (req, res) => {
  try {
    const employees = await EmployeeModels.find({
      isActive: true,
    })
      .populate("storeId")
      .populate("countryId")
      .populate("stateId")
      .populate("cityId")
      .populate("roleId");

    return res.status(200).json({
      isOk: true,
      data: employees,
      status: 200,
    });
  } catch (error) {

    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

const listEmployeesByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, isActive } = req.body;

    // Build the initial match condition
    let matchCondition = {};
    if (isActive !== undefined && isActive !== null && isActive !== "") {
      matchCondition.isActive = isActive;
    }

    let query = [
      {
        $match: matchCondition,
      },
      {
        $lookup: {
          from: "storemasters",
          localField: "storeId",
          foreignField: "_id",
          as: "store",
        },
      },
      {
        $unwind: {
          path: "$store",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "rolemasters",
          localField: "roleId",
          foreignField: "_id",
          as: "role",
        },
      },
      {
        $unwind: {
          path: "$role",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $facet: {
          stage1: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
          ],
          stage2: [{ $skip: skip }, { $limit: per_page }],
        },
      },
      {
        $unwind: "$stage1",
      },
      {
        $project: {
          count: "$stage1.count",
          data: "$stage2",
        },
      },
    ];

    if (match) {
      let searchConditions = {
        $or: [
          { employeeName: { $regex: match, $options: "i" } },
          { emailOffice: { $regex: match, $options: "i" } },
          { mobileNumber: { $regex: match, $options: "i" } },
          {
            "store.storeName": {
              $regex: match,
              $options: "i",
            },
          },
        ],
      };

      if (mongoose.Types.ObjectId.isValid(match)) {
        searchConditions.$or.push(
          { storeId: new mongoose.Types.ObjectId(match) },
          { roleId: new mongoose.Types.ObjectId(match) },
        );
      }

      query = [{ $match: searchConditions }].concat(query);
    }

    if (sorton && sortdir) {
      let sort = {};
      sort[sorton] = sortdir === "desc" ? -1 : 1;
      query = [{ $sort: sort }].concat(query);
    } else {
      query = [{ $sort: { createdAt: -1 } }].concat(query);
    }

    const list = await EmployeeModels.aggregate(query);

    return res.status(200).json({
      data: list,
      status: 200,
    });
  } catch (error) {
    console.error("Error in listEmployeesByParams:", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

const listAllEmployeesByStore = async (req, res) => {
  try {
    const { storeId } = req.params;



    const employees = await EmployeeModels.find({
      storeId,
      isActive: true,
    });

    return res.status(200).json({
      isOk: true,
      data: employees,
      status: 200,
    });
  } catch (error) {

    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

const loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "unknown";

    const employee = await EmployeeModels.findOne({ emailOffice: email })
      .populate("storeId")
      .populate("countryId")
      .populate("stateId")
      .populate("cityId")
      .populate("roleId")
      .exec();

    if (!employee) {
      return res.status(401).json({
        isOk: false,
        message: "Invalid credentials",
        status: 401,
      });
    }



    // Verify password
    const isPasswordValid = await bcrypt.compare(password, employee.password);

    if (!isPasswordValid) {
      // Record failed attempt
      const attemptResult = await authService.recordFailedAttempt(
        employee._id,
        email,
        ipAddress
      );

      // Check if account just got locked
      if (attemptResult.isLocked) {
        return res.status(423).json({
          isOk: false,
          // message: "Account locked due to multiple failed login attempts",
          // error: "Account locked",
          // lockedUntil: attemptResult.lockUntil,
          // remainingTimeMs: 24 * 60 * 60 * 1000, // 24 hours
          status: 423,
        });
      }

      // Return 401 with remaining attempts
      const warningMessage = attemptResult.attemptsRemaining <= 1
        ? "Warning: One more failed attempt will lock your account"
        : null;

      return res.status(401).json({
        isOk: false,
        message: "Invalid credentials",
        error: "Invalid credentials",
        attemptsRemaining: attemptResult.attemptsRemaining,
        warning: warningMessage,
        status: 401,
      });
    }

    // Successful login - record it and reset attempt count
    await authService.recordSuccessfulLogin(employee._id, email);

    const companyId = employee.storeId ? employee.storeId.companyId : null;
    const employeeStoreId = employee.storeId ? employee.storeId._id || employee.storeId : null;
    const token = await generateToken(employee._id, "EMPLOYEE", companyId, employeeStoreId);

    return res.status(200).json({
      isOk: true,
      message: "Login successful",
      data: employee,
      token: token,
      status: 200,
    });
  } catch (error) {

    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    // The user ID is available in req.user.id from the auth middleware
    const userId = req.user.id;
    let role = null;

    if (!userId) {
      return res.status(400).json({
        isOk: false,
        message: "User ID not found in request",
      });
    }

    let user = null;
    // Fetch the employee details using the correct model variable name
    user = await EmployeeModels.findById(userId);
    if (user) {
      role = "EMPLOYEE";
    }

    if (!user) {
      user = await CompanyMaster.findById(userId);
      if (user) {
        role = "ADMIN";
      }
    }

    if (!user) {
      return res.status(404).json({
        isOk: false,
        message: "User not found",
      });
    }

    const dataToSend = {
      _id: user._id,
      employeeName: user.employeeName,
      emailOffice: user.emailOffice,
      role: role,
      isActive: user.isActive,
      storeId: user.storeId,
      roleId: user.roleId,
    };

    const company = await CompanyMaster.findOne({ isSuperAdmin: false });

    if (role === "EMPLOYEE") {
      dataToSend.companyName = company ? company.companyName : "";
    }

    // Return essential user information
    return res.status(200).json({
      isOk: true,
      message: "User details retrieved successfully",
      data: dataToSend,
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res.status(500).json({
      isOk: false,
      message: error.message || "Error retrieving user details",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { password } = req.body;

    const employee = await EmployeeModels.findById(employeeId);

    if (!employee) {
      return res.status(400).json({
        isOk: false,
        message: "Employee not found",
        status: 400,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    employee.password = hashedPassword;

    await employee.save();

    return res.status(200).json({
      isOk: true,
      message: "Password reset successfully",
      status: 200,
    });
  } catch (error) {

    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};


module.exports = {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeById,
  listAllEmployees,
  listEmployeesByParams,
  listAllEmployeesByStore,
  loginEmployee,
  getCurrentUser,
  resetPassword
};
