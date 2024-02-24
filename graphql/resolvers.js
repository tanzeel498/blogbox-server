const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const { GraphQLError } = require("graphql");

const User = require("../models/user");
const Post = require("../models/post");

module.exports = {
  Query: {
    hello: function (_, _args, context) {
      console.log(_args);
      return "HELlo WoRld!";
    },
    login: async function (_, { email, password }) {
      const user = await User.findOne({ email });
      if (!user) {
        throw new GraphQLError("Incorrect Credentials-E", {
          extensions: { code: 401 },
        });
      }
      const passwordMatched = await bcrypt.compare(password, user.password);
      if (!passwordMatched) {
        throw new GraphQLError("Incorrect Credentials-P", {
          extensions: { code: 401 },
        });
      }
      const token = jwt.sign(
        { email: user.email, userId: user._id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "2h" }
      );

      return { userId: user._id, token };
    },
  },
  Mutation: {
    createUser: async function (_, _args) {
      const { email, name, password } = _args.userInput;
      const errors = [];

      if (!validator.isEmail(email))
        errors.push({ message: "Incorrect Email!" });
      if (!validator.isLength(password, { min: 5 })) {
        errors.push({ message: "Password too short!" });
      }
      if (errors.length) {
        throw new GraphQLError("Invalid Credentials", {
          extensions: { code: 422, data: errors },
        });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new GraphQLError("User Already Exists");
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new User({ email, password: hashedPassword, name });
      const createdUser = await user.save();
      return createdUser._doc;
    },
    createPost: async function (
      _,
      { postInput: { title, content, imageUrl } },
      context
    ) {
      if (!context.req.isAuth) {
        throw new GraphQLError("Not Authenticated", {
          extensions: { code: 401 },
        });
      }

      const errors = [];
      if (!validator.isLength(title, { min: 5 }))
        errors.push({ message: "Invalid title!" });
      if (!validator.isLength(content, { min: 5 }))
        errors.push({ message: "Invalid content!" });
      if (errors.length) {
        throw new GraphQLError("Invalid Credentials", {
          extensions: { code: 422, data: errors },
        });
      }

      const user = await User.findById(context.req.userId);
      const post = new Post({
        title,
        content,
        imageUrl,
        creator: user,
      });

      const savedPost = await post.save(); // fire and forget
      user.posts.push(post);
      user.save(); // fire and forget

      return {
        ...savedPost._doc,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      };
    },
  },
};
