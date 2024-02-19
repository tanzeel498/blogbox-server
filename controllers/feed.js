const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");

const Post = require("../models/post");

exports.getPosts = (req, res, next) => {
  Post.find()
    .then((posts) => {
      if (!posts) {
        const error = new Error("No Posts found");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: "Post fetched", posts });
    })
    .catch((err) => next(err));
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

exports.createPost = (req, res) => {
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

  const post = new Post({
    title,
    content,
    creator: { name: "Tanzeel" },
    imageUrl: req.file.path,
  });

  post
    .save()
    .then((postData) => {
      res.status(201).json({
        message: "Post created successfully",
        post: postData,
      });
    })
    .catch((err) => next(err));
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
    .then((post) => {
      if (!post) {
        const error = new Error("No Post exists");
        error.statusCode = 404;
        throw error;
      }

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

const clearImage = (filePath) => {
  const updatedPath = path.join(__dirname, "..", filePath);
  fs.unlink(updatedPath, (err) => console.error(err));
};
