const { Router } = require("express");
const { body } = require("express-validator");

const authController = require("../controllers/auth");
const User = require("../models/user");

const router = Router();

router.post(
  "/signup",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Enter a valid Email")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) Promise.reject("Email already exists!");
        });
      }),
    body("name").trim().notEmpty(),
    body("password").trim().isLength({ min: 5 }),
  ],
  authController.signup
);

module.exports = router;
