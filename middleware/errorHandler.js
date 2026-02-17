// Global error handler middleware Handles errors from services and other middleware
const errorHandler = (err, req, res, next) => {
  // Log error for debugging (only in development)
  if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
    console.error("Error:", err);
  }

  // Get status code (services use statusCode, some middleware use status)
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal server error";

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      status: "error",
      message: errors.join(", "),
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      status: "error",
      message: `${field} already exists`,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      status: "error",
      message: "Invalid ID format",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      status: "error",
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      status: "error",
      message: "Token expired",
    });
  }

  // Send error response with consistent format
  res.status(statusCode).json({
    status: "error",
    message,
  });
};

module.exports = errorHandler;