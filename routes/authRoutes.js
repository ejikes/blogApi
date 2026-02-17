const express = require("express");
const router = express.Router();
const authController = require("../controllers/authControllers");
const validate = require("../middleware/validate");
const { signupSchema, loginSchema } = require("../controllers/authValidator");

// signup - with validation
router.post("/signup", validate(signupSchema), authController.signup);

// login - with validation
router.post("/login", validate(loginSchema), authController.login);

module.exports = router;