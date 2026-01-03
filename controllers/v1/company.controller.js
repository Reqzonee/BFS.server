import CompanyMasterModels from "../../models/CompanyMaster.js";
import EmployeeModels from "../../models/Employee.js";
import { generateToken } from "../../utils/generateToken.js";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";

export const createCompanyMaster = async (req, res) => {
  try {
    const {
      companyName,
      email,
      password,
      mobileNumber,
      gstNumber,
      countryId,
      stateId,
      cityId,
      address,
      pincode,
      website,
      isActive,
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const companyMaster = new CompanyMasterModels({
      companyName,
      email,
      password: hashedPassword,
      mobileNumber,
      gstNumber,
      countryId,
      stateId,
      cityId,
      address,
      pincode,
      website,
      isActive,
    });

    // Handle file uploads
    if (req.files && req.files.logo) {
      companyMaster.logo = req.files.logo[0].path;
    }

    if (req.files && req.files.favicon) {
      companyMaster.favicon = req.files.favicon[0].path;
    }

    await companyMaster.save();

    return res.status(201).json({
      isOk: true,
      message: "Company Master created successfully",
    });
  } catch (error) {
    console.log("Error in createCompanyMaster", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
    });
  }
};

export const updateCompanyMaster = async (req, res) => {
  try {
    const companyId = req.params.id;
    const companyMaster = await CompanyMasterModels.findById(companyId);

    if (!companyMaster) {
      return res.status(404).json({
        isOk: false,
        message: "Company Master not found",
      });
    }

    const updateFields = [
      "companyName",
      "email",
      "contactPersonName",
      "contactNumber",
      "mobileNumber",
      "gstNumber",
      "countryId",
      "stateId",
      "cityId",
      "address",
      "pincode",
      "isActive",
    ];

    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        companyMaster[field] = req.body[field];
      }
    });

    // Handle file updates
    if (req.files && req.files.logo) {
      if (companyMaster.logo) {
        const oldLogoPath = path.join(companyMaster.logo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
      companyMaster.logo = req.files.logo[0].path;
    }

    if (req.files && req.files.favicon) {
      if (companyMaster.favicon) {
        const oldFaviconPath = path.join(companyMaster.favicon);
        if (fs.existsSync(oldFaviconPath)) {
          fs.unlinkSync(oldFaviconPath);
        }
      }
      companyMaster.favicon = req.files.favicon[0].path;
    }

    await companyMaster.save();

    return res.status(200).json({
      isOk: true,
      message: "Company Master updated successfully",
    });
  } catch (error) {
    console.error("Error in updateCompanyMaster", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
    });
  }
};

export const loginCompany = async (req, res) => {
  const { email, password } = req.body;

  let user = null;
  let token = null;

  const companyMaster = await CompanyMasterModels.findOne({
    email,
    isActive: true,
  })
    .populate("countryId")
    .populate("stateId")
    .populate("cityId")
    .exec();

  const employee = await EmployeeModels.findOne({
    emailOffice: email,
    isActive: true,
  })
    .populate("departmentId")
    .populate("stateId")
    .populate("cityId")
    .exec();

  if (companyMaster) {
    user = companyMaster;
    token = await generateToken(companyMaster._id, "ADMIN");
  }

  if (employee) {
    user = employee;
    token = await generateToken(employee._id, "EMPLOYEE");
  }

  console.log(user);

  if (!user) {
    return res.status(404).json({
      isOk: false,
      message: "User not found",
    });
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    return res.status(400).json({
      isOk: false,
      message: "Invalid email or password",
    });
  }

  const company = await CompanyMasterModels.findOne({ isSuperAdmin: false });

  const dataToSend = user;

  if (employee) {
    dataToSend.companyName = company ? company.companyName : "";
  }

  return res.status(200).json({
    isOk: true,
    message: "Login successful",
    data: dataToSend,
    token: token,
  });
};

export const getCompanyMasterById = async (req, res) => {
  try {
    const { companyId } = req.params;

    let user = null;
    let role = null;

    const companyMaster = await CompanyMasterModels.findById(companyId)
      .populate("countryId")
      .populate("stateId")
      .populate("cityId")
      .exec();

    const employee = await EmployeeModels.findById(companyId)
      .populate("departmentId")
      .populate("countryId")
      .populate("stateId")
      .populate("cityId")
      .exec();

    if (!companyMaster && !employee) {
      return res.status(404).json({
        isOk: false,
        message: "Company or Employee not found",
        status: 404,
      });
    }

    if (!companyMaster) {
      user = employee;
      role = "EMPLOYEE";
    }

    if (!employee) {
      user = companyMaster;
      role = "ADMIN";
    }

    const company = await CompanyMasterModels.findOne({
      isSuperAdmin: false,
    });

    if (employee) {
      user.companyName = company ? company.companyName : "";
    }

    return res.status(200).json({
      isOk: true,
      data: user,
      role: role,
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};
