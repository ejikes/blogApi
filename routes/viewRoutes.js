const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const authService = require("../services/authService");
const blogService = require("../services/blogService");
const requireLogin = require("../middleware/requireLogin");
const validate = require("../middleware/validate");
const { signupSchema, loginSchema } = require("../controllers/authValidator");
const { createBlogSchema, updateBlogSchema } = require("../controllers/blogValidator");

// HOME PAGE (search + pagination)
router.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const options = {
      page,
      limit,
      title: req.query.search,
      tags: req.query.tag,
    };

    const result = await blogService.getPublishedBlogs(options);

    res.render("index", {
      blogs: result.blogs,
      currentPage: result.pagination.page,
      totalPages: result.pagination.pages,
      search: req.query.search
    });
  } catch (error) {
    next(error);
  }
});


// CREATE BLOG PAGE
router.get("/blogs/create", requireLogin, (req, res) => {
  res.render("create");
});

// CREATE BLOG
router.post("/blogs", requireLogin, validate(createBlogSchema), async (req, res, next) => {
  try {
    // Prepare blog data
    const blogData = {
      title: req.body.title,
      description: req.body.description,
      body: req.body.body,
      tags: (req.body.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    // Create blog using service
    await blogService.createBlog(blogData, req.session.user.id);

    res.redirect("/dashboard");
  } catch (error) {
    next(error);
  }
});


// VIEW SINGLE BLOG
router.get("/blogs/:id", async (req, res, next) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new Error("Invalid blog id"));
    }

    // Get blog using service
    const blog = await blogService.getPublishedBlogById(req.params.id, true);

    res.render("blog", { blog });
  } catch (error) {
    next(error);
  }
});

// EDIT PAGE
router.get("/blogs/:id/edit", requireLogin, async (req, res, next) => {
  try {
    // Get blog using service (with ownership check)
    const blog = await blogService.getBlogById(req.params.id, req.session.user.id);

    res.render("edit", { blog });
  } catch (error) {
    next(error);
  }
});

// UPDATE BLOG
router.put(
  "/blogs/:id",
  requireLogin,
  validate(updateBlogSchema),
  async (req, res, next) => {
    try {
      // Prepare update data
      const updateData = {
        title: req.body.title,
        description: req.body.description,
        body: req.body.body,
      };

      if (req.body.tags) {
        updateData.tags = req.body.tags.split(",").map((t) => t.trim());
      }

      // Update blog using service
      await blogService.updateBlog(req.params.id, req.session.user.id, updateData);

      res.redirect("/dashboard");
    } catch (error) {
      next(error);
    }
  }
);


// DELETE BLOG
router.post("/blogs/:id/delete", requireLogin, async (req, res, next) => {
  try {
    // Delete blog using service
    await blogService.deleteBlog(req.params.id, req.session.user.id);

    res.redirect("/dashboard");
  } catch (error) {
    next(error);
  }
});


// PUBLISH BLOG
router.post("/blogs/:id/publish", requireLogin, async (req, res, next) => {
  try {
    // Publish blog using service
    await blogService.publishBlog(req.params.id, req.session.user.id);

    res.redirect("/dashboard");
  } catch (error) {
    next(error);
  }
});


// DASHBOARD
router.get("/dashboard", requireLogin, async (req, res, next) => {
  try {
    // Get user's blogs using service
    const result = await blogService.getUserBlogs(req.session.user.id, {
      limit: 100, // Get all blogs for dashboard
    });

    res.render("dashboard", { blogs: result.blogs });
  } catch (error) {
    next(error);
  }
});


// SIGNUP
router.get("/signup", (req, res) => {
  res.render("auth/signup", { error: null });
});

router.post("/signup", validate(signupSchema), async (req, res, next) => {
  try {
    console.log('Signup attempt for:', req.body.email);
    
    const result = await authService.signup(req.body);
    
    console.log('Signup service successful');
    
    // Set session
    req.session.user = {
      id: result.user.id,
      first_name: result.user.first_name,
    };
    
    // CRITICAL: Save session before redirect
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.render("auth/signup", { 
          error: "Signup successful but session error. Please try login." 
        });
      }
      console.log('Session saved successfully, redirecting to home');
      res.redirect("/");
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    if (error.statusCode === 400) {
      return res.render("auth/signup", { 
        error: "Email already registered. Please login instead." 
      });
    }
    res.render("auth/signup", { 
      error: "Signup failed. Please try again." 
    });
  }
});

// LOGIN
router.get("/login", (req, res) => {
  res.render("auth/login", { error: null });
});

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email } = req.body;
    
    console.log('Login attempt for:', email);
    
    await authService.login(req.body);
    
    console.log('Login service successful');

    const User = require("../models/users");
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error('User not found after successful login');
      return res.render("auth/login", { 
        error: "Login error. Please try again." 
      });
    }
    
    console.log('User found:', user.email);

    // Set session
    req.session.user = {
      id: user._id.toString(),
      first_name: user.first_name,
    };
    
    // CRITICAL: Save session before redirect
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.render("auth/login", { 
          error: "Login successful but session error. Please try again." 
        });
      }
      console.log('Session saved successfully, redirecting to home');
      res.redirect("/");
    });
  } catch (error) {
    console.error('Login error:', error.message);
    if (error.statusCode === 401) {
      return res.render("auth/login", { 
        error: "Invalid email or password" 
      });
    }
    res.render("auth/login", { 
      error: "Login failed. Please try again." 
    });
  }
});

// LOGOUT
router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

module.exports = router;