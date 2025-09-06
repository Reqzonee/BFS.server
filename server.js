const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

global.__basedir = __dirname;

// Create log directory if it doesn't exist
if (!fs.existsSync("log")) {
    fs.mkdirSync("log");
}

// Global error handling to prevent crashes
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    logError(error);
    // Don't exit the process, let it continue running
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    logError({ message: 'Unhandled Promise Rejection', error: reason });
    // Don't exit the process, let it continue running
});

// Function to log errors
function logError(error) {
    let filedata = {
        datetime: new Date(),
        message: error?.message,
        stack: error?.stack,
    };
    try {
        let writecontent = [];
        if (fs.existsSync("log/error.html")) {
            let filedata = fs.readFileSync("log/error.html");
            if (filedata) {
                try {
                    writecontent = JSON.parse(filedata);
                } catch (e) {
                    // If parsing fails, start with empty array
                    writecontent = [];
                }
            }
        }
        writecontent.push(filedata);
        fs.writeFileSync("log/error.html", JSON.stringify(writecontent));
    } catch (err) {
        console.error('Error logging to file:', err);
    }
}

const app = express();
let databasestatus = "In-Progress";
app.use(cors());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});
app.options("*", cors());
app.use("/uploads", express.static("uploads"));
app.use("/log", express.static("log"));
mongoose.set("strictQuery", false);
mongoose
    .connect(process.env.DATABASE, { useNewUrlParser: true })
    .then(() => {
        databasestatus = "DB connected";
        console.log("DB connected");
    })
    .catch((err) => {
        databasestatus = err;
        console.log("DB Error => ", err);
    });

// autoIncrement.initialize(mongoose.connection);

//middlewares
app.use(morgan("dev"));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static("files"));

//routes
// app.use("/api", authRoutes);
fs.readdirSync("./routes").map((r) =>
    app.use("/api", require("./routes/" + r))
);

// app.use("/api", require("./routes/ToDoTask"));

app.get("/api", (req, res) => {
    res.json({
        status: "ok",
        message: "API server is running",
        database: databasestatus,
        timestamp: new Date().toISOString()
    });
});

app.use("/", express.static(path.join(__dirname, "/out/admin")));

app.get("/*", async (req, res) => {
    res.sendFile(path.join(__dirname, "/out/admin", "index.html"));
});

app.get("/error", (req, res) => {
    res.test("hit the api button. v-24.01.2024.");
});

app.use(async (err, req, res, next) => {
    let filedata = {
        datetime: new Date(),
        message: err?.message,
        stake: err?.stack,
    };
    try {
        let writecontent = [];
        if (fs.existsSync("log/error.html")) {
            let filedata = fs.readFileSync("log/error.html");
            if (filedata) {
                writecontent = JSON.parse(filedata);
            }
        }
        writecontent.push(filedata);
        fs.writeFileSync(
            "log/error.html",
            JSON.stringify(writecontent),
            function (err) {
                if (err) throw err;
                console.log("Saved!");
            }
        );
    } catch (error) {}

    return res.status(500).json({
        success: false,
        msg: "We are updating",
        data: filedata,
    });
});

const port = process.env.PORT || 8000;

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
});
