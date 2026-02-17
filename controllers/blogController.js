const blogService = require("../services/blogService");

// Create a new blog (draft)
const createBlog = async (req, res, next) => {
  try {
    const blog = await blogService.createBlog(req.body, req.user._id);

    res.status(201).json({
      status: "success",
      blog,
    });
  } catch (error) {
    next(error);
  }
};

// Get all published blogs (with pagination, filtering, and sorting)
const getPublishedBlogs = async (req, res, next) => {
  try {
    const result = await blogService.getPublishedBlogs(req.query);

    res.json({
      status: "success",
      results: result.blogs.length,
      total: result.pagination.total,
      page: result.pagination.page,
      blogs: result.blogs,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single published blog
const getSingleBlog = async (req, res, next) => {
  try {
    const blog = await blogService.getPublishedBlogById(req.params.id);

    res.json({
      status: "success",
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

//Publish a blog (change state to published)
const publishBlog = async (req, res, next) => {
  try {
    const blog = await blogService.publishBlog(req.params.id, req.user._id);

    res.json({
      status: "success",
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

//Update a blog
const updateBlog = async (req, res, next) => {
  try {
    const blog = await blogService.updateBlog(
      req.params.id,
      req.user._id,
      req.body
    );

    res.json({
      status: "success",
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

//Delete a blog
const deleteBlog = async (req, res, next) => {
  try {
    await blogService.deleteBlog(req.params.id, req.user._id);

    res.json({
      status: "success",
      message: "Blog deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

//Get current user's blogs (with pagination and state filter)
const getMyBlogs = async (req, res, next) => {
  try {
    const result = await blogService.getUserBlogs(req.user._id, req.query);

    res.json({
      status: "success",
      results: result.blogs.length,
      total: result.pagination.total,
      page: result.pagination.page,
      data: result.blogs,
    });
  } catch (error) {
    next(error);
  }
};

// Get blog statistics
const getBlogStats = async (req, res, next) => {
  try {
    const stats = await blogService.getUserBlogStats(req.user._id);

    res.json({
      status: "success",
      stats,
    });
  } catch (error) {
    next(error);
  }
};

//Search blogs
const searchBlogs = async (req, res, next) => {
  try {
    const result = await blogService.searchBlogs(req.query);

    res.json({
      status: "success",
      results: result.blogs.length,
      total: result.pagination.total,
      page: result.pagination.page,
      blogs: result.blogs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBlog,
  getPublishedBlogs,
  getSingleBlog,
  publishBlog,
  updateBlog,
  deleteBlog,
  getMyBlogs,
  getBlogStats,
  searchBlogs,
};