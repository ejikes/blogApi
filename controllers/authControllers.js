const authService = require("../services/authService");

//Register a new user
const signup = async (req, res, next) => {
  try {
    const result = await authService.signup(req.body);

    res.status(201).json({
      status: "success",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

//Login user
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    res.json({
      status: "success",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user._id);

    res.json({
      status: "success",
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  getProfile,
};