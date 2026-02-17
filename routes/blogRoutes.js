const express = require("express");
const router = express.Router();

const blogController = require("../controllers/blogController");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { createBlogSchema, updateBlogSchema } = require("../controllers/blogValidator");

// get my blogs (protected) 
router.get("/me", authMiddleware, blogController.getMyBlogs);

// create blog (protected) - with validation
router.post("/", authMiddleware, validate(createBlogSchema), blogController.createBlog);

// get published blogs (public)
router.get("/", blogController.getPublishedBlogs);

// get single published blog (public)
router.get("/:id", blogController.getSingleBlog);

// publish blog (protected)
router.post("/:id/publish", authMiddleware, blogController.publishBlog);

// update blog (protected) - with validation
router.put("/:id", authMiddleware, validate(updateBlogSchema), blogController.updateBlog);

// delete blog (protected)
router.delete("/:id", authMiddleware, blogController.deleteBlog);

module.exports = router;