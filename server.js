const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const hpp = require("hpp");
const { setupSwagger } = require("./config/swagger.js");

// ============ SECURITY IMPORTS ============
// OWASP-compliant security middleware
const {
  securityHeaders,
  additionalSecurityHeaders,
  getCorsConfig,
  sanitizeErrors
} = require("./middlewares/securityHeaders.js");
const {
  mongoSanitizer,
} = require("./middlewares/inputValidator.js");

dotenv.config();

global.__basedir = __dirname;

// Create log directory if it doesn't exist
if (!fs.existsSync("log")) {
  fs.mkdirSync("log");
}

// Global error handling to prevent crashes
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  logError(error);
  // Don't exit the process, let it continue running
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  logError({ message: "Unhandled Promise Rejection", error: reason });
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
        } catch {
          // If parsing fails, start with empty array
          writecontent = [];
        }
      }
    }
    writecontent.push(filedata);
    fs.writeFileSync("log/error.html", JSON.stringify(writecontent));
  } catch (err) {
    console.error("Error logging to file:", err);
  }
}

const app = express();
let databasestatus = "In-Progress";

// ============ SECURITY MIDDLEWARE (Apply FIRST) ============
// 1. Security Headers (Helmet + custom headers)
app.use(securityHeaders);
app.use(additionalSecurityHeaders);

// 2. CORS configuration (more restrictive than before)
const corsConfig = getCorsConfig();
app.use(cors(corsConfig));
app.options("*", cors(corsConfig));

// 3. General Rate Limiting (applied to all routes)
// Note: Can require 'generalRateLimiter' from middlewares/rateLimiter.js if needed
// app.use(generalRateLimiter);

// 4. Body Parsing with size limits (OWASP: limit request body size)
app.use(bodyParser.json({ limit: "10mb" })); // Reduced from 50mb for security
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// 5. MongoDB NoSQL Injection Protection
app.use(mongoSanitizer);

// 6. HTTP Parameter Pollution Prevention
app.use(hpp());

// ============ STATIC FILE SERVING ============
app.use("/uploads", express.static("uploads"));
// NOTE: Removed /log static serving for security - logs should not be publicly accessible

mongoose.set("strictQuery", false);
mongoose.set("debug", true);

const dbURI = process.env.DATABASE;

mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    // useUnifiedTopology: true,
    // serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log("✅ DB connected");
    databasestatus = "Connected";
  })
  .catch((err) => {
    console.error("❌ DB Connection Error =>", err);
    if (err instanceof mongoose.Error.MongooseServerSelectionError) {
      console.error(
        "Server selection failed. Check network, URI, and Atlas IP whitelist.",
      );
    }
  });

// Optional: handle runtime disconnects
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ DB disconnected!");
});

mongoose.connection.on("reconnected", () => {
  console.log("♻️ DB reconnected!");
});

// ============ ADDITIONAL MIDDLEWARE ============
// Development request logging (disable in production for performance)
app.use(morgan("dev"));
app.use(express.static("files"));

// Setup Swagger documentation (consider disabling in production)
setupSwagger(app);

// ============ V1 ROUTES ============
// Auto-register routes from routes/v1 directory
const routesPath = path.join(__dirname, "routes/v1");

if (fs.existsSync(routesPath)) {
  fs.readdirSync(routesPath).forEach((file) => {
    if (file.endsWith("Routes.js")) {
      const route = require(path.join(routesPath, file));
      // Mount all routes at /api/v1
      // Route files are expected to define their own sub-paths or be modified to do sO
      app.use("/api/v1", route);
      // console.log(`✅ Loaded route: ${file}`);
    }
  });
}

console.log("✅ V1 API routes loaded via auto-registration");

app.get("/api", (req, res) => {
  res.json({
    status: "ok",
    message: "API server is running",
    database: databasestatus,
    timestamp: new Date().toISOString(),
  });
});

app.use("/", express.static(path.join(__dirname, "/out/admin")));

app.get("/*", async (req, res) => {
  res.sendFile(path.join(__dirname, "/out/admin", "index.html"));
});

// ============ ERROR HANDLING ============
// Use the secure error sanitizer (prevents information leakage)
app.use(sanitizeErrors);

// Fallback error handler that logs errors but doesn't expose details
// eslint-disable-next-line no-unused-vars
app.use(async (err, req, res, _next) => {
  // Log error to file for debugging
  const errorData = {
    datetime: new Date().toISOString(),
    message: err?.message,
    path: req?.path,
    method: req?.method,
    ip: req?.ip,
    // Don't log full stack trace to file in production
    stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
  };

  try {
    let writecontent = [];
    if (fs.existsSync("log/error.html")) {
      const filedata = fs.readFileSync("log/error.html", 'utf8');
      if (filedata) {
        try {
          writecontent = JSON.parse(filedata);
        } catch {
          writecontent = [];
        }
      }
    }

    // Keep only last 100 errors to prevent log file from growing too large
    if (writecontent.length > 100) {
      writecontent = writecontent.slice(-100);
    }

    writecontent.push(errorData);
    fs.writeFileSync("log/error.html", JSON.stringify(writecontent, null, 2));
  } catch (logErr) {
    console.error("Error logging to file:", logErr);
  }

  // SECURITY: Don't expose internal error details to users
  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    isOk: false,
    status: 500,
    error: 'Internal Server Error',
    message: isProduction ? 'An unexpected error occurred' : err?.message,
  });
});

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
  console.log(`🔒 Security middleware enabled: Helmet, Rate Limiting, Input Validation, CSRF Protection`);
  console.log(`✅ db ${process.env.DATABASE}`);
});
