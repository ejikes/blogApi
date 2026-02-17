require("dotenv").config({ path: ".env.test" });

const request = require("supertest");
const app = require("../app");
const db = require("./setup");
const Blog = require("../models/blog");

jest.setTimeout(30000);

let token;
let userId;

beforeAll(async () => {
  await db.connect();
});

afterAll(async () => {
  await db.disconnect();
});

beforeEach(async () => {
  await db.clearDatabase();

  // Create a test user and get token
  const signupRes = await request(app)
    .post("/api/auth/signup")
    .send({
      first_name: "Blog",
      last_name: "Tester",
      email: "blogtester@example.com",
      password: "password123",
    });

  token = signupRes.body.token;
  userId = signupRes.body.user.id;
});

describe("Blog API - Complete Test Suite", () => {
  const validBlog = {
    title: "Test Blog Title",
    description: "This is a test blog description",
    body: "This is the blog body content with enough words to meet the minimum requirement of twenty words for validation.",
    tags: "javascript,testing,jest",
  };

  describe("POST /api/blogs - Create Blog", () => {
    it("should successfully create a blog with all fields", async () => {
      const res = await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${token}`)
        .send(validBlog);

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.blog).toBeDefined();
      expect(res.body.blog.title).toBe(validBlog.title);
      expect(res.body.blog.description).toBe(validBlog.description);
      expect(res.body.blog.body).toBe(validBlog.body);
      expect(res.body.blog.author).toBe(userId);
      expect(res.body.blog.state).toBe("draft");
      expect(res.body.blog.reading_time).toBeDefined();
      expect(res.body.blog.read_count).toBe(0);
    });

    it("should create a blog with only required fields", async () => {
      const minimalBlog = {
        title: "Minimal Blog",
        body: "This is the minimum required body content for the blog post validation.",
      };

      const res = await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${token}`)
        .send(minimalBlog);

      expect(res.statusCode).toBe(201);
      expect(res.body.blog.title).toBe(minimalBlog.title);
      expect(res.body.blog.body).toBe(minimalBlog.body);
    });

    it("should reject blog creation without authentication", async () => {
      const res = await request(app).post("/api/blogs").send(validBlog);

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain("Not authorized");
    });

    it("should reject blog creation with invalid token", async () => {
      const res = await request(app)
        .post("/api/blogs")
        .set("Authorization", "Bearer invalid_token")
        .send(validBlog);

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain("Token invalid");
    });

    it("should reject blog creation without title", async () => {
      const invalidBlog = { ...validBlog };
      delete invalidBlog.title;

      const res = await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidBlog);

      expect(res.statusCode).toBe(400); // Joi validation returns 400
      expect(res.body.error).toBeDefined();
    });

    it("should reject blog creation without body", async () => {
      const invalidBlog = { ...validBlog };
      delete invalidBlog.body;

      const res = await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidBlog);

      expect(res.statusCode).toBe(400); // Joi validation returns 400
      expect(res.body.error).toBeDefined();
    });

    it("should reject blog creation with body less than 20 characters", async () => {
      const invalidBlog = { ...validBlog, body: "Too short" };

      const res = await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidBlog);

      expect(res.statusCode).toBe(400); // Joi validation returns 400
      expect(res.body.error).toBeDefined();
    });

    it("should calculate reading time correctly", async () => {
      // Create exactly 400 words
      const words = [];
      for (let i = 0; i < 400; i++) {
        words.push("word");
      }
      const longBody = words.join(" "); // 400 words separated by single spaces

      const res = await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Long Blog",
          body: longBody,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.blog.reading_time).toBe(2); // 400 words / 200 wpm = 2 minutes
    });

    it("should set author to authenticated user", async () => {
      const res = await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${token}`)
        .send(validBlog);

      expect(res.body.blog.author).toBe(userId);
    });
  });

  describe("GET /api/blogs - Get Published Blogs", () => {
    beforeEach(async () => {
      // Create some test blogs
      await Blog.create({
        title: "Published Blog 1",
        body: "Content for published blog one with enough words for validation requirements.",
        author: userId,
        state: "published",
        reading_time: 1,
      });

      await Blog.create({
        title: "Published Blog 2",
        body: "Content for published blog two with enough words for validation requirements.",
        author: userId,
        state: "published",
        reading_time: 1,
      });

      await Blog.create({
        title: "Draft Blog",
        body: "Content for draft blog with enough words for validation requirements.",
        author: userId,
        state: "draft",
        reading_time: 1,
      });
    });

    it("should get all published blogs", async () => {
      const res = await request(app).get("/api/blogs");

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.blogs).toBeDefined();
      expect(Array.isArray(res.body.blogs)).toBe(true);
      expect(res.body.blogs.length).toBe(2); // Only published blogs
    });

    it("should not return draft blogs in public listing", async () => {
      const res = await request(app).get("/api/blogs");

      const draftBlogs = res.body.blogs.filter((b) => b.state === "draft");
      expect(draftBlogs.length).toBe(0);
    });

    it("should populate author information", async () => {
      const res = await request(app).get("/api/blogs");

      expect(res.body.blogs[0].author).toBeDefined();
      expect(res.body.blogs[0].author.first_name).toBeDefined();
      expect(res.body.blogs[0].author.email).toBeDefined();
    });

    it("should return blogs sorted by newest first", async () => {
      const res = await request(app).get("/api/blogs");

      const dates = res.body.blogs.map((b) => new Date(b.createdAt));
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i + 1].getTime());
      }
    });

    it("should support pagination with page parameter", async () => {
      const res = await request(app).get("/api/blogs?page=1&limit=1");

      expect(res.statusCode).toBe(200);
      expect(res.body.blogs.length).toBe(1);
      expect(res.body.page).toBe(1);
    });

    it("should support filtering by author", async () => {
      // Create another user and blog
      const user2 = await request(app)
        .post("/api/auth/signup")
        .send({
          first_name: "Another",
          last_name: "User",
          email: "another@example.com",
          password: "password123",
        });

      await Blog.create({
        title: "Another User Blog",
        body: "Content from another user with enough words for validation.",
        author: user2.body.user.id,
        state: "published",
        reading_time: 1,
      });

      const res = await request(app).get(`/api/blogs?author=${userId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.blogs.every((b) => b.author._id === userId)).toBe(true);
    });

    it("should support filtering by title", async () => {
      const res = await request(app).get("/api/blogs?title=Blog 1");

      expect(res.statusCode).toBe(200);
      expect(res.body.blogs.length).toBeGreaterThan(0);
      expect(res.body.blogs[0].title).toContain("Blog 1");
    });

    it("should work without authentication", async () => {
      const res = await request(app).get("/api/blogs");

      expect(res.statusCode).toBe(200);
    });

    it("should return empty array when no published blogs exist", async () => {
      await Blog.deleteMany({ state: "published" });

      const res = await request(app).get("/api/blogs");

      expect(res.statusCode).toBe(200);
      expect(res.body.blogs).toEqual([]);
    });
  });

  describe("GET /api/blogs/:id - Get Single Blog", () => {
    let publishedBlogId;

    beforeEach(async () => {
      const blog = await Blog.create({
        title: "Single Blog",
        body: "Content for single blog with enough words for validation requirements.",
        author: userId,
        state: "published",
        reading_time: 1,
        read_count: 5,
      });
      publishedBlogId = blog._id;
    });

    it("should get a single published blog by id", async () => {
      const res = await request(app).get(`/api/blogs/${publishedBlogId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toBeDefined();
      expect(res.body.data.title).toBe("Single Blog");
    });

    it("should increment read count when viewing a blog", async () => {
      const initialBlog = await Blog.findById(publishedBlogId);
      const initialCount = initialBlog.read_count;

      await request(app).get(`/api/blogs/${publishedBlogId}`);

      const updatedBlog = await Blog.findById(publishedBlogId);
      expect(updatedBlog.read_count).toBe(initialCount + 1);
    });

    it("should populate author information", async () => {
      const res = await request(app).get(`/api/blogs/${publishedBlogId}`);

      expect(res.body.data.author).toBeDefined();
      expect(res.body.data.author.first_name).toBe("Blog");
      expect(res.body.data.author.email).toBe("blogtester@example.com");
    });

    it("should return 404 for non-existent blog id", async () => {
      const fakeId = "507f1f77bcf86cd799439011"; // Valid MongoDB ObjectId format

      const res = await request(app).get(`/api/blogs/${fakeId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe("error");
    });

    it("should return 404 for draft blog", async () => {
      const draftBlog = await Blog.create({
        title: "Draft Blog",
        body: "Draft content with enough words for validation requirements.",
        author: userId,
        state: "draft",
        reading_time: 1,
      });

      const res = await request(app).get(`/api/blogs/${draftBlog._id}`);

      expect(res.statusCode).toBe(404);
    });

    it("should work without authentication", async () => {
      const res = await request(app).get(`/api/blogs/${publishedBlogId}`);

      expect(res.statusCode).toBe(200);
    });
  });

  describe("PUT /api/blogs/:id - Update Blog", () => {
    let blogId;

    beforeEach(async () => {
      const res = await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${token}`)
        .send(validBlog);

      blogId = res.body.blog._id;
    });

    it("should successfully update own blog", async () => {
      const updates = {
        title: "Updated Title",
        body: "Updated body content with enough words to meet validation requirements for the blog.",
      };

      const res = await request(app)
        .put(`/api/blogs/${blogId}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updates);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.title).toBe(updates.title);
      expect(res.body.data.body).toBe(updates.body);
    });

    it("should update reading time when body is changed", async () => {
      // Create exactly 600 words
      const words = [];
      for (let i = 0; i < 600; i++) {
        words.push("word");
      }
      const longBody = words.join(" "); // 600 words = 3 minutes

      const res = await request(app)
        .put(`/api/blogs/${blogId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ body: longBody });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.reading_time).toBe(3);
    });

    it("should reject update without authentication", async () => {
      const res = await request(app)
        .put(`/api/blogs/${blogId}`)
        .send({ title: "New Title" });

      expect(res.statusCode).toBe(401);
    });

    it("should reject update of another user's blog", async () => {
      // Create another user
      const user2 = await request(app)
        .post("/api/auth/signup")
        .send({
          first_name: "Another",
          last_name: "User",
          email: "another@example.com",
          password: "password123",
        });

      const res = await request(app)
        .put(`/api/blogs/${blogId}`)
        .set("Authorization", `Bearer ${user2.body.token}`)
        .send({ title: "Hacked Title" });

      expect(res.statusCode).toBe(404);
    });

    it("should return 404 for non-existent blog", async () => {
      const fakeId = "507f1f77bcf86cd799439011";

      const res = await request(app)
        .put(`/api/blogs/${fakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "New Title" });

      expect(res.statusCode).toBe(404);
    });

    it("should allow partial updates", async () => {
      const res = await request(app)
        .put(`/api/blogs/${blogId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Only Title Updated" });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.title).toBe("Only Title Updated");
      expect(res.body.data.body).toBe(validBlog.body); // Body unchanged
    });
  });

  describe("POST /api/blogs/:id/publish - Publish Blog", () => {
    let blogId;

    beforeEach(async () => {
      const res = await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${token}`)
        .send(validBlog);

      blogId = res.body.blog._id;
    });

    it("should successfully publish own draft blog", async () => {
      const res = await request(app)
        .post(`/api/blogs/${blogId}/publish`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.state).toBe("published");
    });

    it("should make published blog visible in public listing", async () => {
      await request(app)
        .post(`/api/blogs/${blogId}/publish`)
        .set("Authorization", `Bearer ${token}`);

      const listRes = await request(app).get("/api/blogs");

      const publishedBlog = listRes.body.blogs.find(
        (b) => b._id === blogId
      );
      expect(publishedBlog).toBeDefined();
    });

    it("should reject publish without authentication", async () => {
      const res = await request(app).post(`/api/blogs/${blogId}/publish`);

      expect(res.statusCode).toBe(401);
    });

    it("should reject publish of another user's blog", async () => {
      const user2 = await request(app)
        .post("/api/auth/signup")
        .send({
          first_name: "Another",
          last_name: "User",
          email: "another@example.com",
          password: "password123",
        });

      const res = await request(app)
        .post(`/api/blogs/${blogId}/publish`)
        .set("Authorization", `Bearer ${user2.body.token}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("DELETE /api/blogs/:id - Delete Blog", () => {
    let blogId;

    beforeEach(async () => {
      const res = await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${token}`)
        .send(validBlog);

      blogId = res.body.blog._id;
    });

    it("should successfully delete own blog", async () => {
      const res = await request(app)
        .delete(`/api/blogs/${blogId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.message).toContain("deleted");
    });

    it("should remove blog from database after deletion", async () => {
      await request(app)
        .delete(`/api/blogs/${blogId}`)
        .set("Authorization", `Bearer ${token}`);

      const blog = await Blog.findById(blogId);
      expect(blog).toBeNull();
    });

    it("should reject delete without authentication", async () => {
      const res = await request(app).delete(`/api/blogs/${blogId}`);

      expect(res.statusCode).toBe(401);
    });

    it("should reject delete of another user's blog", async () => {
      const user2 = await request(app)
        .post("/api/auth/signup")
        .send({
          first_name: "Another",
          last_name: "User",
          email: "another@example.com",
          password: "password123",
        });

      const res = await request(app)
        .delete(`/api/blogs/${blogId}`)
        .set("Authorization", `Bearer ${user2.body.token}`);

      expect(res.statusCode).toBe(404);
    });

    it("should return 404 for non-existent blog", async () => {
      const fakeId = "507f1f77bcf86cd799439011";

      const res = await request(app)
        .delete(`/api/blogs/${fakeId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("GET /api/blogs/me - Get My Blogs", () => {
    beforeEach(async () => {
      // Create some blogs for the test user
      await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "My Draft Blog",
          body: "Content for my draft blog with enough words for validation.",
        });

      await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "My Published Blog",
          body: "Content for my published blog with enough words for validation.",
        });

      // Publish one blog
      const blogs = await Blog.find({ author: userId });
      blogs[0].state = "published";
      await blogs[0].save();
    });

    it("should get all blogs by authenticated user", async () => {
      const res = await request(app)
        .get("/api/blogs/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it("should include both draft and published blogs", async () => {
      const res = await request(app)
        .get("/api/blogs/me")
        .set("Authorization", `Bearer ${token}`);

      const states = res.body.data.map((b) => b.state);
      expect(states).toContain("draft");
      expect(states).toContain("published");
    });

    it("should reject request without authentication", async () => {
      const res = await request(app).get("/api/blogs/me");

      expect(res.statusCode).toBe(401);
    });

    it("should only return blogs owned by authenticated user", async () => {
      // Create another user with a blog
      const user2 = await request(app)
        .post("/api/auth/signup")
        .send({
          first_name: "Another",
          last_name: "User",
          email: "another@example.com",
          password: "password123",
        });

      await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${user2.body.token}`)
        .send({
          title: "Other User Blog",
          body: "Content from other user with enough words for validation.",
        });

      const res = await request(app)
        .get("/api/blogs/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.data.every((b) => b.author === userId)).toBe(true);
      expect(res.body.data.length).toBe(2); // Only our 2 blogs
    });
  });
});