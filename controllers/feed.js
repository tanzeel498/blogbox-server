const fs = require("fs");
const path = require("path");
const { validationResult } = require("express-validator");

const io = require("../socket");

const ITEMS_PER_PAGE = 2;

const Post = require("../models/post");
const User = require("../models/user");

exports.getPosts = async (req, res, next) => {
  const { page } = req.query || 1;
  try {
    const numItems = await Post.find().countDocuments();
    Post.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .populate("creator")
      .sort({ createdAt: -1 })
      .then((posts) => {
        if (!posts) {
          const error = new Error("No Posts found");
          error.statusCode = 404;
          throw error;
        }
        res
          .status(200)
          .json({ message: "Post fetched", posts, totalItems: numItems });
      });
  } catch (err) {
    next(err);
  }
};

exports.getPost = (req, res, next) => {
  const { postId } = req.params;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("No Post exists");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: "Post fetched", post });
    })
    .catch((err) => next(err));
};

exports.createPost = async (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const error = new Error("Validation Failed, entered data is Incorrect!");
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error("No Image provided!");
    error.statusCode = 422;
    throw error;
  }
  const { title, content } = req.body;

  try {
    const post = new Post({
      title,
      content,
      creator: req.userId,
      imageUrl: req.file.path,
    });

    post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    user.save(); // fire and forget

    io.getIO().emit("posts", {
      action: "create",
      post: { ...post._doc, creator: { _id: user._id, name: user.name } },
    });

    res.status(201).json({
      message: "Post created successfully",
      post: post,
      creator: { _id: user._id, name: user.name },
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePost = (req, res, next) => {
  const { postId } = req.params;

  const result = validationResult(req);
  if (!result.isEmpty()) {
    const error = new Error("Validation Failed, entered data is Incorrect!");
    error.statusCode = 422;
    throw error;
  }

  const { title, content } = req.body;
  let imageUrl = req.body.image;
  console.log(req.file);
  if (req.file) imageUrl = req.file.path;

  if (!imageUrl) {
    const error = new Error("No file picked!");
    error.statusCode = 422;
    throw error;
  }

  Post.findById(postId)
    .populate("creator")
    .then((post) => {
      if (!post) {
        const error = new Error("No Post exists");
        error.statusCode = 404;
        throw error;
      }
      if (post.creator._id.toString() !== req.userId) {
        const error = new Error("Not Authorized!");
        error.statusCode = 403;
        throw error;
      }

      io.getIO().emit("posts", { action: "update", post });

      if (imageUrl !== post.imageUrl) clearImage(post.imageUrl);
      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;
      return post.save();
    })
    .then((updatedPost) => {
      res
        .status(200)
        .json({ message: "Post updated Successfully!", post: updatedPost });
    })
    .catch((err) => next(err));
};

exports.deletePost = (req, res, next) => {
  const { postId } = req.params;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("No Post exists");
        error.statusCode = 404;
        throw error;
      }
      if (post.creator.toString() !== req.userId) {
        const error = new Error("Not Authorized!");
        error.statusCode = 403;
        throw error;
      }
      // compare logged in user with the user of this post
      clearImage(post.imageUrl);
      return Post.findByIdAndDelete(postId);
    })
    .then((result) => User.findById(req.userId))
    .then((user) => {
      user.posts.pull(postId);
      return user.save();
    })
    .then((result) => {
      console.log(result);
      io.getIO().emit("posts", { action: "delete", post: postId });
      res.status(200).json({ message: "Post deleted!" });
    })
    .catch((err) => next(err));
};

const clearImage = (filePath) => {
  const updatedPath = path.join(__dirname, "..", filePath);
  fs.unlink(updatedPath, (err) => console.error(err));
};
