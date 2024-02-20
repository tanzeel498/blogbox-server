const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error("Incorrect Credentials-E!");
      error.statusCode = 401;
      throw error;
    }
    const passwordMatched = bcrypt.compare(password, user.password);
    if (!passwordMatched) {
      const error = new Error("Incorrect Credentials-P!");
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      { email: user.email, userId: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "2h" }
    );

    res.status(200).json({ userId: user._id, token });
  } catch (err) {
    next(err);
  }
};
