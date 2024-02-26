require("dotenv").config();
const path = require("node:path");
const https = require("https");
const fs = require("node:fs");
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const { createYoga, createSchema } = require("graphql-yoga");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");
const auth = require("./middleware/auth");
const { clearImage } = require("./util/helpers");

const app = express();

const privateKey = fs.readFileSync("server.key");
const certificate = fs.readFileSync("server.cert");

const schema = createSchema({
  typeDefs: graphqlSchema,
  resolvers: graphqlResolver,
});
const yoga = createYoga({
  schema,
});

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

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);

// app.use(
//   helmet({
//     crossOriginResourcePolicy: false,
//   })
// );
app.use(compression());
app.use(morgan("common", { stream: accessLogStream }));
app.use(express.json());
app.use(multer({ storage: fileStorage, fileFilter }).single("image"));
app.use("/images", express.static(path.join(__dirname, "images")));

// app.use(cors());
// below controller is to allow cors
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(auth);

app.put("/post-image", (req, res) => {
  if (!req.isAuth) {
    throw new Error("Not Authenticated!");
  }
  if (!req.file) {
    return res.status(200).json({ message: "No file Provided!" });
  }
  if (req.body.oldPath) clearImage(req.body.oldPath);
  return res
    .status(201)
    .json({ message: "File Stored!", filePath: req.file.path });
});

app.use("/graphql", yoga);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Mongoose Connected!");

    // https
    //   .createServer({ key: privateKey, cert: certificate }, app)
    //   .listen(process.env.PORT || 8080);
    app.listen(process.env.PORT || 8080);
  })
  .catch((err) => console.error(err));

// process.env.NODE_ENV = "production"
