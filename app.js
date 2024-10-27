require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const fs = require("fs");
const app = express();
const authRoutes = require("./routes/auth");
const emailRoutes = require("./routes/email");
const apiRoutes = require("./routes/api");

// Create uploads directory if it doesn't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Multer configuration
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const extension = file.originalname.split(".").pop(); // Get file extension
    cb(null, `${Date.now()}.${extension}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const isValidType = allowedTypes.test(file.mimetype);
    if (isValidType) return cb(null, true);
    cb(new Error("Invalid file type"));
  },
});

// Middleware setup
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

// MySQL connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "wpr",
  password: "fit2024",
  database: "wpr2201140077",
  port: "3306",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    process.exit(1);
  }
  console.log("Connected to the MySQL database.");
});

app.use((req, res, next) => {
  req.connection = connection;
  next();
});

// Render sign_in view
app.get("/signin", (req, res) => {
  res.render("sign_in");
});

// Upload route for file attachment
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    console.error("No file received");
    return res.status(400).send("Error: No file uploaded.");
  }
  console.log("File received:", req.file);
  res.send("File uploaded successfully.");
});

// Use routes
app.use("/", authRoutes);
app.use("/email", emailRoutes);
app.use("/api", apiRoutes);

// 404 Route
app.use((req, res) => {
  res.status(404).render("404", { error: "Page Not Found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong! Please try again later.");
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
