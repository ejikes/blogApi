const Blog = require("../models/blog");
const calculateReadingTime = require("../util/readingTime");

//Create a new blog

const createBlog = async (blogData, authorId) => {
  const { title, description, body, tags } = blogData;

  // Calculate reading time
  const reading_time = calculateReadingTime(body);

  // Create blog
  const blog = await Blog.create({
    title,
    description,
    body,
    tags,
    reading_time,
    author: authorId,
    state: "draft",
  });

  return blog;
};

//Get published blogs with filters, pagination, and sorting
const getPublishedBlogs = async (options = {}) => {
  const {
    page = 1,
    limit = 20,
    author,
    title,
    tags,
    order_by = "createdAt",
    order = "desc",
  } = options;

  // Build query
  const query = { state: "published" };

  if (author) query.author = author;
  if (title) query.title = { $regex: title, $options: "i" };
  if (tags) query.tags = tags;

  // Validate and set sort options
  const allowedSortFields = ["read_count", "reading_time", "createdAt", "timestamp"];
  const sortField = allowedSortFields.includes(order_by) ? order_by : "createdAt";
  const actualSortField = sortField === "timestamp" ? "createdAt" : sortField;
  const sortOrder = order === "asc" ? 1 : -1;

  // Pagination
  const skip = (page - 1) * limit;

  // Execute query
  const [blogs, total] = await Promise.all([
    Blog.find(query)
      .populate("author", "first_name last_name email")
      .sort({ [actualSortField]: sortOrder })
      .limit(Number(limit))
      .skip(skip),
    Blog.countDocuments(query),
  ]);

  return {
    blogs,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    },
  };
};

//Get a blog by ID (regardless of state)
const getBlogById = async (blogId, userId) => {
  const blog = await Blog.findById(blogId).populate(
    "author",
    "first_name last_name email"
  );

  if (!blog) {
    const error = new Error("Blog not found");
    error.statusCode = 404;
    throw error;
  }

  // Check ownership
  if (blog.author._id.toString() !== userId) {
    const error = new Error("Not authorized to access this blog");
    error.statusCode = 403;
    throw error;
  }

  return blog;
};

//Get a single published blog by ID
const getPublishedBlogById = async (blogId, incrementReadCount = true) => {
  const blog = await Blog.findOne({
    _id: blogId,
    state: "published",
  }).populate("author", "first_name last_name email");

  if (!blog) {
    const error = new Error("Blog not found");
    error.statusCode = 404;
    throw error;
  }

  // Increment read count if requested
  if (incrementReadCount) {
    blog.read_count += 1;
    await blog.save();
  }

  return blog;
};

//Publish a blog (change state to published)
const publishBlog = async (blogId, userId) => {
  const blog = await Blog.findOne({
    _id: blogId,
    author: userId,
  });

  if (!blog) {
    const error = new Error("Blog not found or unauthorized");
    error.statusCode = 404;
    throw error;
  }

  blog.state = "published";
  await blog.save();

  return blog;
};

// Update a blog
const updateBlog = async (blogId, userId, updateData) => {
  const blog = await Blog.findOne({
    _id: blogId,
    author: userId,
  });

  if (!blog) {
    const error = new Error("Blog not found or unauthorized");
    error.statusCode = 404;
    throw error;
  }

  // Update allowed fields
  const allowedUpdates = ["title", "description", "body", "tags", "state"];
  allowedUpdates.forEach((field) => {
    if (updateData[field] !== undefined) {
      blog[field] = updateData[field];
    }
  });

  // Recalculate reading time if body changed
  if (updateData.body) {
    blog.reading_time = calculateReadingTime(updateData.body);
  }

  await blog.save();

  return blog;
};

// Delete a blog
const deleteBlog = async (blogId, userId) => {
  const blog = await Blog.findOneAndDelete({
    _id: blogId,
    author: userId,
  });

  if (!blog) {
    const error = new Error("Blog not found or unauthorized");
    error.statusCode = 404;
    throw error;
  }

  return blog;
};

// Get user's blogs with filters and pagination
const getUserBlogs = async (userId, options = {}) => {
  const { page = 1, limit = 20, state } = options;

  // Build query
  const query = { author: userId };
  if (state && ["draft", "published"].includes(state)) {
    query.state = state;
  }

  // Pagination
  const skip = (page - 1) * limit;

  // Execute query
  const [blogs, total] = await Promise.all([
    Blog.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip),
    Blog.countDocuments(query),
  ]);

  return {
    blogs,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    },
  };
};

// Get blog statistics for a user
const getUserBlogStats = async (userId) => {
  const [totalBlogs, publishedBlogs, draftBlogs, totalReads] = await Promise.all([
    Blog.countDocuments({ author: userId }),
    Blog.countDocuments({ author: userId, state: "published" }),
    Blog.countDocuments({ author: userId, state: "draft" }),
    Blog.aggregate([
      { $match: { author: userId } },
      { $group: { _id: null, total: { $sum: "$read_count" } } },
    ]),
  ]);

  return {
    total: totalBlogs,
    published: publishedBlogs,
    drafts: draftBlogs,
    totalReads: totalReads[0]?.total || 0,
  };
};

// Search blogs by multiple criteria
const searchBlogs = async (searchParams) => {
  const { query, tags, author, page = 1, limit = 20 } = searchParams;

  const filter = { state: "published" };

  // Text search
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { body: { $regex: query, $options: "i" } },
    ];
  }

  // Tag filter
  if (tags && tags.length > 0) {
    filter.tags = { $in: tags };
  }

  // Author filter
  if (author) {
    filter.author = author;
  }

  const skip = (page - 1) * limit;

  const [blogs, total] = await Promise.all([
    Blog.find(filter)
      .populate("author", "first_name last_name email")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip),
    Blog.countDocuments(filter),
  ]);

  return {
    blogs,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  createBlog,
  getPublishedBlogs,
  getBlogById,
  getPublishedBlogById,
  publishBlog,
  updateBlog,
  deleteBlog,
  getUserBlogs,
  getUserBlogStats,
  searchBlogs,
};