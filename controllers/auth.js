const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

const User = require("../models/user");

exports.signup = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const error = new Error("Validation Failed, entered data is Incorrect!");
    error.statusCode = 422;
    error.data = result.array();
    throw error;
  }

  const { email, password, name } = req.body;

  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({ email, password: hashedPassword, name });
      return user.save();
    })
    .then((newUser) => {
      res.status(201).json({ message: "User Created successfully!" });
    })
    .catch((err) => next(err));
};
