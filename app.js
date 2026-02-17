require("dotenv").config();
const path = require('path')
const express = require("express");
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");
const methodOverride = require("method-override");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");

// Database
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");
const viewRoutes = require("./routes/viewRoutes");

// Middleware
const errorHandler = require("./middleware/errorHandler");

// Initialize app
const app = express();

// Connect to database
connectDB();

// MIDDLEWARE

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Method override for PUT and DELETE in forms
app.use(methodOverride("_method"));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Make user available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});


// Set security headers
app.use(helmet());

// Prevent HTTP parameter pollution
app.use(hpp());

// Rate limiting (skip in test environment)
if (process.env.NODE_ENV !== "test") {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: "Too many requests, please try again later",
  });
  app.use(limiter);
}

// VIEW ENGINE
app.set("view engine", "ejs");
app.use(expressLayouts);           
app.set("layout", "layout");  

// API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);

// View routes 
app.use("/", viewRoutes);

// ERROR HANDLING
app.use(errorHandler);

module.exports = app;