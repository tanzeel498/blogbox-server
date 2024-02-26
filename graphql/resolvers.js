const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const { GraphQLError } = require("graphql");

const User = require("../models/user");
const Post = require("../models/post");
const { clearImage } = require("../util/helpers");

const ITEMS_PER_PAGE = 2;

class UserDoc {
  constructor(user) {
    this._id = user._id.toString();
    this.name = user.name;
    this.email = user.email;
    this.status = user.status;
    this.posts = user.posts;
  }
}

class PostDoc {
  constructor(post) {
    this._id = post._id.toString();
    this.title = post.title;
    this.content = post.content;
    this.imageUrl = post.imageUrl;
    this.creator = post.creator;
    this.createdAt = post.createdAt.toISOString();
    this.updatedAt = post.updatedAt.toISOString();
  }
}

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

    posts: async function (_, { page }, context) {
      checkAuth(context.req.isAuth);

      const pageNumber = page || 1;
      const totalPosts = await Post.find().countDocuments();
      const posts = await Post.find()
        .skip((pageNumber - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .populate("creator", "name")
        .sort({ createdAt: -1 });
      if (!posts) {
        throw new GraphQLError("No Posts found!", {
          extensions: { code: 404 },
        });
      }

      return {
        posts: posts.map((post) => new PostDoc(post)),
        totalPosts,
      };
    },

    post: async function (_, { id }, context) {
      if (!context.req.isAuth) {
        throw new GraphQLError("Not Authenticated", {
          extensions: { code: 401 },
        });
      }

      const post = await Post.findById(id).populate("creator");
      if (!post) {
        throw new GraphQLError("No Post found!", {
          extensions: { code: 404 },
        });
      }

      return new PostDoc(post);
    },

    user: async function (_, _args, context) {
      checkAuth(context.req.isAuth);

      const user = await User.findById(context.req.userId);
      if (!user) {
        throw new GraphQLError("No User found!", {
          extensions: { code: 404 },
        });
      }

      return new UserDoc(user);
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
      return new UserDoc(createdUser);
    },

    createPost: async function (
      _,
      { postInput: { title, content, imageUrl } },
      context
    ) {
      checkAuth(context.req.isAuth);

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

      return new PostDoc(post);
    },

    updatePost: async function (_, { id, postInput }, context) {
      checkAuth(context.req.isAuth);

      const post = await Post.findById(id).populate("creator");
      if (!post) {
        throw new GraphQLError("No Post found!", {
          extensions: { code: 404 },
        });
      }

      if (post.creator._id.toString() !== context.req.userId) {
        throw new GraphQLError("Not Authorized!", {
          extensions: { code: 403 },
        });
      }

      const { title, content, imageUrl } = postInput;
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

      if (imageUrl !== "undefined") {
        post.imageUrl = imageUrl;
      }
      post.title = title;
      post.content = content;
      await post.save();

      return new PostDoc(post);
    },

    deletePost: async function (_, { id }, context) {
      checkAuth(context.req.isAuth);

      const post = await Post.findById(id);

      if (!post) {
        throw new GraphQLError("No Post found!", {
          extensions: { code: 404 },
        });
      }
      if (post.creator.toString() !== context.req.userId) {
        throw new GraphQLError("Not Authorized!", {
          extensions: { code: 403 },
        });
      }

      await Post.findByIdAndDelete(id);
      clearImage(post.imageUrl);
      const user = await User.findById(context.req.userId);
      user.posts.pull(id);
      await user.save();
      return true;
    },

    updateStatus: async function (_, { status }, context) {
      checkAuth(context.req.isAuth);

      const user = await User.findById(context.req.userId);
      if (!user) {
        throw new GraphQLError("No User found!", {
          extensions: { code: 404 },
        });
      }

      if (status === user.status) {
        return new UserDoc(user);
      }

      user.status = status;
      const savedUser = await user.save();

      return new UserDoc(savedUser);
    },
  },
};

function checkAuth(isAuth) {
  if (!isAuth) {
    throw new GraphQLError("Not Authenticated", {
      extensions: { code: 401 },
    });
  }
}
