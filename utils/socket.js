const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");
const Employee = require("../models/Employee");

let io;

const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "*", // Adjust this for production
            methods: ["GET", "POST"],
        },
    });

    console.log("✅ Socket.io Initialized");

    // Middleware for Socket Authentication
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;

            if (!token) {
                return next(new Error("Authentication error: Token missing"));
            }

            let decoded = null;
            let userType = null;

            // Try different secrets based on user roles
            const secrets = [
                { key: process.env.CUSTOMER_JWT_SECRET_KEY, type: "customer" },
                { key: process.env.EMPLOYEE_JWT_SECRET_KEY, type: "employee" },
                { key: process.env.ADMIN_JWT_SECRET_KEY, type: "admin" }
            ];

            for (const secret of secrets) {
                if (!secret.key) continue;
                try {
                    decoded = jwt.verify(token, secret.key);
                    userType = secret.type;
                    break;
                } catch (err) {
                    continue;
                }
            }

            if (!decoded || !decoded.id) {
                return next(new Error("Authentication error: Invalid token"));
            }

            // Fetch user to ensure they still exist and are active
            if (userType === "customer") {
                const customer = await Customer.findById(decoded.id);
                if (!customer || !customer.isActive) {
                    return next(new Error("Authentication error: Customer inactive or not found"));
                }
                socket.user = { id: customer._id, type: "customer", storeId: null };
            } else {
                // Employee or Admin
                let user;
                if (userType === "employee") {
                    user = await Employee.findById(decoded.id);
                } else {
                    const CompanyMaster = require("../models/CompanyMaster");
                    user = await CompanyMaster.findById(decoded.id);
                }

                if (!user || user.isActive === false) {
                    return next(new Error(`Authentication error: ${userType} inactive or not found`));
                }

                socket.user = {
                    id: user._id,
                    type: userType,
                    storeId: user.storeId || decoded.storeId
                };
            }

            next();
        } catch (error) {
            console.error("Socket Auth Error:", error);
            next(new Error("Internal server error during authentication"));
        }
    });

    io.on("connection", (socket) => {
        const { id, type, storeId } = socket.user;
        console.log(`📡 New connection: ${type} ${id} (Socket: ${socket.id})`);

        // Join specific room based on user type
        if (type === "customer") {
            socket.join(`customer:${id}`);
            console.log(`👤 Customer ${id} joined room: customer:${id}`);
        } else if ((type === "employee" || type === "admin") && storeId) {
            socket.join(`store:${storeId}`);
            console.log(`🏪 ${type} ${id} joined room: store:${storeId}`);
        }

        // Admins without storeId (SuperAdmins) or even those with storeId should join a global admin room
        if (type === "admin") {
            socket.join("global:admin");
            console.log(`👑 Admin ${id} joined room: global:admin`);
        }

        socket.on("disconnect", (reason) => {
            console.log(`🔌 Disconnected: ${type} ${id} (Reason: ${reason})`);
        });

        socket.on("error", (error) => {
            console.error(`Socket Error for ${id}:`, error);
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

const emitToRoom = (room, event, data) => {
    if (io) {
        io.to(room).emit(event, data);

        // If it's a new order or status update, also notify global admins
        if (event === "new_order" || event === "order_status_update") {
            io.to("global:admin").emit(event, data);
        }

        console.log(`📢 Emitted ${event} to ${room}${event === "new_order" ? " and global:admin" : ""}`);
    }
};

module.exports = {
    initSocket,
    getIo,
    emitToRoom,
};
