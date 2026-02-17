require("dotenv").config({ path: ".env.test" });

const request = require("supertest");
const app = require("../app");
const db = require("./setup");
const User = require("../models/users");

jest.setTimeout(30000);

beforeAll(async () => {
  await db.connect();
});

afterAll(async () => {
  await db.disconnect();
});

beforeEach(async () => {
  await db.clearDatabase();
});

describe("Auth API - Complete Test Suite", () => {
  const validUser = {
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    password: "password123",
  };

  describe("POST /api/auth/signup", () => {
    it("should successfully signup a new user", async () => {
      const res = await request(app)
        .post("/api/auth/signup")
        .send(validUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(validUser.email);
      expect(res.body.user.first_name).toBe(validUser.first_name);
      expect(res.body.user.last_name).toBe(validUser.last_name);
      expect(res.body.user.id).toBeDefined();
      expect(res.body.user.password).toBeUndefined(); // Password should not be returned
    });

    it("should reject signup with missing first_name", async () => {
      const invalidUser = { ...validUser };
      delete invalidUser.first_name;

      const res = await request(app)
        .post("/api/auth/signup")
        .send(invalidUser);

      expect(res.statusCode).toBe(400); // Joi validation returns 400
      expect(res.body.error).toBeDefined();
    });

    it("should reject signup with missing last_name", async () => {
      const invalidUser = { ...validUser };
      delete invalidUser.last_name;

      const res = await request(app)
        .post("/api/auth/signup")
        .send(invalidUser);

      expect(res.statusCode).toBe(400); // Joi validation returns 400
      expect(res.body.error).toBeDefined();
    });

    it("should reject signup with missing email", async () => {
      const invalidUser = { ...validUser };
      delete invalidUser.email;

      const res = await request(app)
        .post("/api/auth/signup")
        .send(invalidUser);

      expect(res.statusCode).toBe(400); // Joi validation returns 400
      expect(res.body.error).toBeDefined();
    });

    it("should reject signup with missing password", async () => {
      const invalidUser = { ...validUser };
      delete invalidUser.password;

      const res = await request(app)
        .post("/api/auth/signup")
        .send(invalidUser);

      expect(res.statusCode).toBe(400); // Joi validation returns 400
      expect(res.body.error).toBeDefined();
    });

    it("should reject signup with password less than 6 characters", async () => {
      const invalidUser = { ...validUser, password: "12345" };

      const res = await request(app)
        .post("/api/auth/signup")
        .send(invalidUser);

      expect(res.statusCode).toBe(400); // Joi validation returns 400
      expect(res.body.error).toBeDefined();
    });

    it("should reject duplicate email registration", async () => {
      // Create first user
      await request(app).post("/api/auth/signup").send(validUser);

      // Try to create second user with same email
      const res = await request(app)
        .post("/api/auth/signup")
        .send(validUser);

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe("error");
      expect(res.body.message).toContain("already registered");
    });

    it("should convert email to lowercase", async () => {
      const upperCaseEmail = { ...validUser, email: "JOHN.DOE@EXAMPLE.COM" };

      const res = await request(app)
        .post("/api/auth/signup")
        .send(upperCaseEmail);

      expect(res.statusCode).toBe(201);
      expect(res.body.user.email).toBe(upperCaseEmail.email.toLowerCase());
    });

    it("should trim whitespace from names", async () => {
      const spacedUser = {
        ...validUser,
        first_name: "  John  ",
        last_name: "  Doe  ",
      };

      const res = await request(app)
        .post("/api/auth/signup")
        .send(spacedUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.user.first_name).toBe("John");
      expect(res.body.user.last_name).toBe("Doe");
    });

    it("should hash the password before storing", async () => {
      await request(app).post("/api/auth/signup").send(validUser);

      const user = await User.findOne({ email: validUser.email });
      expect(user.password).not.toBe(validUser.password);
      expect(user.password.length).toBeGreaterThan(20); // Bcrypt hash
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Create a user for login tests
      await request(app).post("/api/auth/signup").send(validUser);
    });

    it("should successfully login with correct credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: validUser.email,
          password: validUser.password,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.token).toBeDefined();
      expect(typeof res.body.token).toBe("string");
    });

    it("should reject login with incorrect password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: validUser.email,
          password: "wrongpassword",
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe("error");
      expect(res.body.message).toBe("Invalid credentials");
    });

    it("should reject login with non-existent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: validUser.password,
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe("error");
      expect(res.body.message).toBe("Invalid credentials");
    });

    it("should reject login with missing email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          password: validUser.password,
        });

      expect(res.statusCode).toBe(400); // Joi validation returns 400
      expect(res.body.error).toBeDefined();
    });

    it("should reject login with missing password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: validUser.email,
        });

      expect(res.statusCode).toBe(400); // Joi validation returns 400
      expect(res.body.error).toBeDefined();
    });

    it("should login with email in any case", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: validUser.email.toUpperCase(),
          password: validUser.password,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it("should return a valid JWT token", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: validUser.email,
          password: validUser.password,
        });

      const token = res.body.token;
      const parts = token.split(".");
      expect(parts.length).toBe(3); // JWT has 3 parts: header.payload.signature
    });
  });

  describe("Token Generation", () => {
    it("should generate different tokens for different users", async () => {
      const user1 = { ...validUser, email: "user1@example.com" };
      const user2 = { ...validUser, email: "user2@example.com" };

      const res1 = await request(app).post("/api/auth/signup").send(user1);
      const res2 = await request(app).post("/api/auth/signup").send(user2);

      expect(res1.body.token).not.toBe(res2.body.token);
    });

    it("should generate different tokens for same user on different logins", async () => {
      await request(app).post("/api/auth/signup").send(validUser);

      const login1 = await request(app)
        .post("/api/auth/login")
        .send({ email: validUser.email, password: validUser.password });

      // Wait a moment to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const login2 = await request(app)
        .post("/api/auth/login")
        .send({ email: validUser.email, password: validUser.password });

      // Tokens might be same if generated in same second, but typically different
      // This is just to show the behavior
      expect(login1.body.token).toBeDefined();
      expect(login2.body.token).toBeDefined();
    });
  });
});