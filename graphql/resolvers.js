const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Post = require("../models/post");

module.exports = {
  hello: function (args, request) {
    console.log(args);
    console.log(request);
    return "HELlo WoRld!";
  },
  createUser: async function (args, req) {
    const { email, name, password } = args.userInput;
    const errors = [];

    if (!validator.isEmail(email)) errors.push({ message: "Incorrect Email!" });
    if (!validator.isLength(password, { min: 5 })) {
      errors.push({ message: "Password too short!" });
    }
    if (errors.length) {
      const error = new Error();
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already Exists!");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ email, password: hashedPassword, name });
    const createdUser = await user.save();
    return createdUser._doc;
  },
  login: async function ({ email, password }, req) {
    console.log(req);
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error("Incorrect Credentials-E!");
      error.code = 401;
      throw error;
    }
    const passwordMatched = await bcrypt.compare(password, user.password);
    if (!passwordMatched) {
      const error = new Error("Incorrect Credentials-P!");
      error.code = 401;
      throw error;
    }
    const token = jwt.sign(
      { email: user.email, userId: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "2h" }
    );

    return { userId: user._id, token };
  },
  createPost: async function (
    { postInput: { title, content, imageUrl } },
    req
  ) {
    console.log(req);
    if (!req.isAuth) {
      const error = new Error("Not Authenticated!");
      error.code = 401;
      throw error;
    }

    const errors = [];
    if (!validator.isLength(title, { min: 5 }))
      errors.push({ message: "Invalid title!" });
    if (!validator.isLength(content, { min: 5 }))
      errors.push({ message: "Invalid content!" });
    if (errors.length) {
      const error = new Error();
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const post = new Post({
      title,
      content,
      imageUrl,
      creator: req.userId,
    });

    const savedPost = await post.save(); // fire and forget
    const user = await User.findById(req.userId);
    user.posts.push(post);
    user.save(); // fire and forget

    console.log(post);
    return {
      ...savedPost._doc,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },
};
