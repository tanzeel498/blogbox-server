require("dotenv").config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const { createServer } = require("node:http");

const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");

const app = express();
const httpServer = createServer(app);
const io = require("./socket").init(httpServer);

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  }
  cb(null, false);
};

app.use(express.json());

app.use("/images", express.static(path.join(__dirname, "images")));

// below controller is to allow cors
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

io.on("connection", (socket) => {
  console.log("A user connected!");
});

app.use("/auth", authRoutes);
app.use(
  "/feed",
  multer({ storage: fileStorage, fileFilter }).single("image"),
  feedRoutes
);
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const { message, data } = error;
  res.status(status).json({ message, data });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Mongoose Connected!");
    httpServer.listen(8080);
  })
  .catch((err) => console.error(err));
