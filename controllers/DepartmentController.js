const DepartmentModels = require("../models/Department.js");
const {
    getReferencingCounts,
    formatReferenceMessage,
} = require("../utils/referenceHelper.js");

exports.createDepartment = async (req, res) => {
    try {
        const { departmentName, departmentCode, isActive } = req.body;
        console.log("Request Body:", req.body); // Debugging line
        
        if (!departmentName && !departmentCode) {
            return res.status(400).json({
                message: "Department name and code are required",
                isOk: false,
                status: 400,
            });
        }

        const existingDepartment = await DepartmentModels.findOne({
            departmentCode,
        });

        if (existingDepartment) {
            return res.status(400).json({
                message: "Department already exists",
                isOk: true,
                status: 400,
            });
        }

        const department = new DepartmentModels({
            departmentName,
            departmentCode,
            isActive,
        });

        await department.save();

        return res.status(201).json({
            message: "Department created successfully",
            isOk: true,
            status: 201,
        });
    } catch (error) {
        console.log("Error in createDepartmentName", error);
        return res.status(500).json({
            message: "Internal server error",
            isOk: false,
            status: 500,
        });
    }
};

exports.updateDepartment = async (req, res) => {
    try {
        const { departmentName, departmentCode, isActive } = req.body;
        const { departmentId } = req.params;

        const department = await DepartmentModels.findById(departmentId);

        if (!department) {
            return res.status(400).json({
                message: "Department not found",
                isOk: true,
                status: 400,
            });
        }

        department.departmentName = departmentName;
        department.departmentCode = departmentCode;
        department.isActive = isActive;

        await department.save();

        return res.status(200).json({
            message: "Department updated successfully",
            isOk: true,
            status: 200,
        });
    } catch (error) {
        console.log("Error in updateDepartment", error);
        return res.status(500).json({
            message: "Internal server error",
            isOk: false,
            status: 500,
        });
    }
};

exports.deleteDepartment = async (req, res) => {
    try {
        const { departmentId } = req.params;

        const department = await DepartmentModels.findById(departmentId);

        if (!department) {
            return res.status(400).json({
                message: "Department not found",
                isOk: false,
                status: 400,
            });
        }

        // Check if this department is referenced by other documents
        const referenceInfo = await getReferencingCounts(
            "Department",
            departmentId
        );

        if (referenceInfo.totalReferences > 0) {
            return res.status(409).json({
                message:
                    "Cannot delete department. It is being used by other records.",
                isOk: false,
                status: 409,
                totalReferences: referenceInfo.totalReferences,
                references: referenceInfo.details,
                formattedMessage: formatReferenceMessage(referenceInfo.details),
            });
        }

        // No references found, safe to delete
        await DepartmentModels.findByIdAndDelete(departmentId);

        return res.status(200).json({
            message: "Department deleted successfully",
            isOk: true,
            status: 200,
        });
    } catch (error) {
        console.log("Error in deleteDepartment", error);
        return res.status(500).json({
            message: "Internal server error",
            isOk: false,
            status: 500,
            error: error.message,
        });
    }
};

exports.getDeparmentById = async (req, res) => {
    try {
        const { departmentId } = req.params;

        const department = await DepartmentModels.findById(departmentId);

        if (!department) {
            return res.status(400).json({
                message: "Department not found",
                isOk: true,
                status: 400,
            });
        }

        return res.status(200).json({
            message: "Department found",
            data: department,
            isOk: true,
            status: 200,
        });
    } catch (error) {
        console.log("Error in getDeparmentById", error);
        return res.status(500).json({
            message: "Internal server error",
            isOk: false,
            status: 500,
        });
    }
};

exports.listDepartmentByParams = async (req, res) => {
    try {
        let { skip, per_page, sorton, sortdir, match, isActive } = req.body;

        let query = [
            {
                $match: { isActive: isActive },
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
            query = [
                {
                    $match: {
                        $or: [
                            {
                                departmentName: {
                                    $regex: match,
                                    $options: "i",
                                },
                            },
                            {
                                departmentCode: {
                                    $regex: match,
                                    $options: "i",
                                },
                            },
                        ],
                    },
                },
            ].concat(query);
        }

        // Add sorting
        if (sorton && sortdir) {
            let sort = {};
            sort[sorton] = sortdir === "desc" ? -1 : 1;
            query = [{ $sort: sort }].concat(query);
        } else {
            query = [{ $sort: { createdAt: -1 } }].concat(query);
        }

        const list = await DepartmentModels.aggregate(query);

        return res.status(200).json({
            data: list,
            status: 200,
        });
    } catch (error) {
        console.error("Error in listBranchByParams:", error);
        return res.status(500).json({
            isOk: false,
            message: error.message,
            status: 500,
        });
    }
};

exports.listDepartments = async (req, res) => {
    try {
        const departments = await DepartmentModels.find({ isActive: true });

        return res.status(200).json({
            data: departments,
            status: 200,
        });
    } catch (error) {
        console.error("Error in listBranch:", error);
        return res.status(500).json({
            isOk: false,
            message: error.message,
            status: 500,
        });
    }
};
