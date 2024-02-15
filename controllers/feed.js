const { validationResult } = require("express-validator");

exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        _id: "kl34323",
        title: "blog1",
        creator: { name: "Tanzeel" },
        imageUrl: "images/duck.jpg",
        createdAt: new Date(),
        content: "this is the content of blog 1.",
      },
    ],
    totalItems: 1,
  });
};

exports.createPost = (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res
      .status(422)
      .json({
        message: "Validation Failed, entered data is Incorrect!",
        errors: result.array(),
      });
  }
  const { title, content } = req.body;
  // store post in the DB

  res.status(201).json({
    message: "Post created successfully",
    post: {
      _id: new Date().toISOString(),
      title,
      content,
      creator: { name: "Tanzeel Khan" },
      createdAt: new Date(),
    },
  });
};
