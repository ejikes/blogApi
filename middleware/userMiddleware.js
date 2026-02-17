const Blog = require("../models/blog");

const checkOwnership = async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return res.status(404).json({
      status: "error",
      message: "Blog not found"
    });
  }

  if (blog.author.toString() !== req.user.id) {
    return res.status(403).json({
      status: "error",
      message: "Not allowed"
    });
  }

  req.blog = blog;
  next();
};

module.exports = checkOwnership;
