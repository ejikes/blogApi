const bcrypt = require("bcrypt");
const User = require("../models/users");
const generateToken = require("../util/generateToken");


//Register a new user
const signup = async (userData) => {
  const { first_name, last_name, email, password } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error("Email already registered");
    error.statusCode = 400;
    throw error;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({
    first_name,
    last_name,
    email,
    password: hashedPassword,
  });

  // Generate JWT token
  const token = generateToken(user._id);

  // Return user info and token
  return {
    token,
    user: {
      id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
    },
  };
};

//Login user
const login = async (credentials) => {
  const { email, password } = credentials;

  // Find user and include password field
  const user = await User.findOne({ email }).select("+password");

  // Validate credentials
  if (!user || !(await bcrypt.compare(password, user.password))) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  // Generate JWT token
  const token = generateToken(user._id);

  return { token };
};

//Get user by ID
const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

module.exports = {
  signup,
  login,
  getUserById,
};