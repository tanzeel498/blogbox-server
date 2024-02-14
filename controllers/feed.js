exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      { title: "blog1", content: "this is the content of blog 1." },
      { title: "blog2", content: "this content belongs to the blog 2" },
    ],
  });
};

exports.createPost = (req, res) => {
  const { title, content } = req.body;
  // store post in the DB

  res.status(201).json({
    message: "Post created successfully",
    post: { id: new Date().toISOString(), title, content },
  });
};
