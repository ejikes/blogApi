# 📝 Blog API

A full-stack blogging platform built with Node.js, Express, MongoDB, and EJS. Features include user authentication, blog management, search functionality, and a clean, responsive UI.

## 🌟 Features

### Authentication & Authorization
- ✅ User registration and login
- ✅ JWT-based authentication
- ✅ Session management
- ✅ Password hashing with bcrypt
- ✅ Protected routes and ownership checks

### Blog Management
- ✅ Create, read, update, and delete blogs
- ✅ Draft and published states
- ✅ Automatic reading time calculation
- ✅ Tag system for categorization
- ✅ Author information display
- ✅ Read count tracking

### Search & Discovery
- ✅ Search blogs by title
- ✅ Filter by tags
- ✅ Pagination support
- ✅ Sort by read count, reading time, or date
- ✅ View published blogs only (public)

### User Dashboard
- ✅ View all personal blogs
- ✅ Separate draft and published sections
- ✅ Quick publish from dashboard
- ✅ Edit and delete functionality
- ✅ Blog statistics

### API Endpoints
- ✅ RESTful API architecture
- ✅ Complete CRUD operations
- ✅ Input validation with Joi
- ✅ Comprehensive error handling
- ✅ Service layer architecture

---

## 🏗️ Architecture

### Project Structure
```
blogapi/
├── config/
│   └── db.js                    # Database configuration
├── controllers/
│   ├── authController.js        # Authentication HTTP handlers
│   └── blogController.js        # Blog HTTP handlers
├── middleware/
│   ├── authMiddleware.js        # JWT authentication
│   ├── errorHandler.js          # Global error handling
│   ├── requireLogin.js          # Session authentication
│   └── validate.js              # Request validation
├── models/
│   ├── blog.js                  # Blog schema
│   └── users.js                 # User schema
├── routes/
│   ├── authRoutes.js            # Auth API routes
│   ├── blogRoutes.js            # Blog API routes
│   └── viewRoutes.js            # View/SSR routes
├── services/
│   ├── authService.js           # Auth business logic
│   └── blogService.js           # Blog business logic
├── utils/
│   ├── generateToken.js         # JWT token generation
│   └── readingTime.js           # Reading time calculation
├── validators/
│   ├── authValidator.js         # Auth validation schemas
│   └── blogValidator.js         # Blog validation schemas
├── views/
│   ├── auth/
│   │   ├── login.ejs           # Login page
│   │   └── signup.ejs          # Signup page
│   ├── blog.ejs                # Single blog view
│   ├── create.ejs              # Create blog form
│   ├── dashboard.ejs           # User dashboard
│   ├── edit.ejs                # Edit blog form
│   ├── index.ejs               # Homepage
│   ├── layout.ejs              # Main layout
│   └── 404.ejs                 # Error page
├── tests/
│   ├── auth.test.js            # Auth tests
│   ├── blog.test.js            # Blog tests
│   └── setup.js                # Test configuration
├── .env.example                # Environment template
├── .env.test.example           # Test environment template
├── .gitignore
├── app.js                      # Express app setup
├── server.js                   # Server entry point
└── package.json
```

### Tech Stack

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose
- JWT for authentication
- Bcrypt for password hashing

**Frontend:**
- EJS templating engine
- Express-ejs-layouts
- Vanilla CSS (embedded)

**Testing:**
- Jest
- Supertest

**Security:**
- Helmet.js
- Express Rate Limit
- HPP (HTTP Parameter Pollution)
- Input validation with Joi

---


## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Auth tests only
npx jest tests/auth.test.js

# Blog tests only
npx jest tests/blog.test.js
```

### Test Coverage
```bash
npm test -- --coverage
```

### Test Results
- ✅ 62 tests passing
- ✅ Auth tests: 20 passing
- ✅ Blog tests: 42 passing
- ✅ 100% requirements coverage

---

## 📚 API Documentation

### Base URL
```
Development: http://localhost:5000
Production: https://your-app.onrender.com
```

### Authentication Endpoints

#### Sign Up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Blog Endpoints

#### Get All Published Blogs
```http
GET /api/blogs?page=1&limit=20&search=nodejs&order_by=read_count&order=desc
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search in title
- `tags` (optional): Filter by tag
- `author` (optional): Filter by author ID
- `order_by` (optional): Sort field (read_count, reading_time, createdAt)
- `order` (optional): Sort order (asc, desc)

**Response:**
```json
{
  "status": "success",
  "results": 10,
  "total": 50,
  "page": 1,
  "blogs": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Getting Started with Node.js",
      "description": "A beginner's guide to Node.js",
      "body": "Blog content here...",
      "tags": ["nodejs", "javascript"],
      "author": {
        "_id": "507f1f77bcf86cd799439012",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com"
      },
      "state": "published",
      "read_count": 150,
      "reading_time": 5,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Single Blog
```http
GET /api/blogs/:id
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Getting Started with Node.js",
    "body": "Full blog content...",
    "author": { ... },
    "read_count": 151
  }
}
```

#### Create Blog (Protected)
```http
POST /api/blogs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My New Blog Post",
  "description": "Short description",
  "body": "Full blog content here...",
  "tags": ["nodejs", "express"]
}
```

**Response:**
```json
{
  "status": "success",
  "blog": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "My New Blog Post",
    "state": "draft",
    "reading_time": 3,
    "author": "507f1f77bcf86cd799439012",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Update Blog (Protected)
```http
PUT /api/blogs/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "body": "Updated content"
}
```

#### Delete Blog (Protected)
```http
DELETE /api/blogs/:id
Authorization: Bearer <token>
```

#### Publish Blog (Protected)
```http
POST /api/blogs/:id/publish
Authorization: Bearer <token>
```

#### Get My Blogs (Protected)
```http
GET /api/blogs/me?page=1&limit=20&state=draft
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `state` (optional): Filter by state (draft, published)

---

## 🌐 View Routes (SSR)

### Public Routes
- `GET /` - Homepage (blog listing)
- `GET /blogs/:id` - View single blog
- `GET /login` - Login page
- `GET /signup` - Signup page

### Protected Routes (Session-based)
- `GET /dashboard` - User dashboard
- `GET /blogs/create` - Create blog page
- `GET /blogs/:id/edit` - Edit blog page
- `POST /blogs` - Create blog
- `PUT /blogs/:id` - Update blog
- `DELETE /blogs/:id/delete` - Delete blog
- `POST /blogs/:id/publish` - Publish blog
- `GET /logout` - Logout

---

## 🔒 Environment Variables

### Required Variables

```env
# Server Configuration
NODE_ENV=development              # development, production, test
PORT=5000                         # Server port

# Database
MONGO_URI=mongodb://localhost:27017/blogapi    # MongoDB connection string

# Authentication
JWT_SECRET=your-jwt-secret-key    # Secret for JWT tokens
JWT_EXPIRES=1h                    # Token expiration time
SESSION_SECRET=your-session-key   # Secret for sessions
```

### Optional Variables

```env
# Rate Limiting (production)
RATE_LIMIT_WINDOW=15              # Minutes
RATE_LIMIT_MAX=100                # Max requests per window
```

---

## 🛡️ Security Features

- **Authentication:** JWT tokens with 1-hour expiration
- **Password Security:** Bcrypt hashing with salt rounds
- **Input Validation:** Joi schema validation on all inputs
- **SQL Injection Prevention:** Mongoose ODM protection
- **XSS Protection:** Helmet.js security headers
- **Rate Limiting:** Express rate limit (100 requests/15 min)
- **HTTP Parameter Pollution:** HPP middleware
- **CORS:** Configurable cross-origin requests
- **Session Security:** HTTP-only, secure cookies in production

---

## 📊 Database Schema

### User Model
```javascript
{
  first_name: String (required, 2-30 chars),
  last_name: String (required, 2-30 chars),
  email: String (required, unique, lowercase),
  password: String (required, hashed, min 6 chars),
  createdAt: Date,
  updatedAt: Date
}
```

### Blog Model
```javascript
{
  title: String (required, 3-200 chars),
  description: String (optional, max 500 chars),
  body: String (required, min 20 chars),
  tags: [String],
  author: ObjectId (ref: User),
  state: String (enum: ['draft', 'published'], default: 'draft'),
  read_count: Number (default: 0),
  reading_time: Number (calculated),
  createdAt: Date,
  updatedAt: Date
}
```