# Backend Setup & Configuration Guide

## Overview

This guide explains how to set up and configure the backend to work with the frontend JWT authentication system.

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                # MongoDB connection
│   ├── controllers/
│   │   └── authController.js    # Auth logic (register, login, getCurrentUser)
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT validation middleware
│   ├── models/
│   │   └── User.js              # User schema
│   └── routes/
│       └── authRoutes.js        # Auth endpoints
├── app.js                       # Express app setup
├── server.js                    # Server entry point
├── package.json                 # Dependencies
├── .env                         # Environment variables (create this)
└── .env.example                 # Template
```

## Setup Instructions

### 1. Create .env File

Create a `.env` file in the backend root directory:

```
MONGODB_URI=mongodb://localhost:27017/hyperlocal-marketplace
JWT_SECRET=your_super_secret_jwt_key_12345_change_in_production
PORT=5000
NODE_ENV=development
```

**Important:**
- Change `JWT_SECRET` to a strong random string in production
- Update `MONGODB_URI` to your MongoDB connection string
- Keep `PORT=5000` to match frontend's `NEXT_PUBLIC_API_URL`

### 2. Install Dependencies

```bash
npm install
```

Required packages (already in package.json):
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT generation/validation
- `bcryptjs` - Password hashing
- `cors` - Cross-Origin Resource Sharing
- `dotenv` - Environment variables

### 3. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Expected output:
```
Server running on port 5000
Database connected successfully
```

## Authentication Endpoints

### 1. Register User

**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "profileImage": "image_url_optional",
  "rating": 0
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "user_mongo_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "profileImage": "",
    "location": {
      "lat": 40.7128,
      "lng": -74.0060
    },
    "rating": 0
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

### 2. Login User

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User logged in successfully",
  "user": {
    "_id": "user_mongo_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "profileImage": "",
    "location": { "lat": 40.7128, "lng": -74.0060 },
    "rating": 0
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### 3. Get Current User

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "_id": "user_mongo_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "profileImage": "",
    "location": { "lat": 40.7128, "lng": -74.0060 },
    "rating": 0
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

## How Auth Middleware Works

The `authMiddleware` protects routes by:

1. **Reading Bearer Token:**
   - Checks `Authorization` header for "Bearer <token>"
   - Rejects if no token provided (401)

2. **Validating JWT:**
   - Verifies token using `JWT_SECRET`
   - Rejects if invalid or expired (401)

3. **Attaching User:**
   - Extracts user ID from token
   - Fetches user from database
   - Attaches user to `req.user`

4. **Proceeding:**
   - Calls `next()` to proceed to route handler
   - Route handler can access user via `req.user`

**Example Usage:**
```javascript
// Protect a route
router.get("/protected-route", authMiddleware, (req, res) => {
  // req.user is now available
  console.log(req.user);
  res.json({ message: "This is protected" });
});
```

## JWT Token Details

### Token Structure

JWTs have 3 parts separated by dots:
```
header.payload.signature

header: Algorithm and type
payload: User ID { id: "user_mongo_id" }
signature: HMAC-SHA256(header.payload, JWT_SECRET)
```

### Token Expiration

Set to **7 days** by default:
```javascript
jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
```

Modify in `authController.js` as needed:
- `"24h"` - 24 hours
- `"7d"` - 7 days
- `"30d"` - 30 days

## Database Configuration

### MongoDB Connection

The app uses MongoDB via Mongoose ORM.

**Connection String Format:**
```
mongodb://[username:password@]host:port/database
```

**Examples:**
```
# Local MongoDB
mongodb://localhost:27017/hyperlocal-marketplace

# MongoDB Atlas
mongodb+srv://user:password@cluster.mongodb.net/hyperlocal-marketplace
```

**Connection Status:**
- Connected: "Database connected successfully"
- Error: Check MongoDB is running and connection string is correct

## CORS Configuration

CORS is enabled to allow frontend requests:

```javascript
app.use(cors()); // Allows all origins
```

For production, restrict origins:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
```

## Error Handling

### Common Errors

**400 Bad Request**
- Missing required fields
- Invalid email format
- Password too short

**401 Unauthorized**
- No token provided
- Invalid/expired token
- User not found

**409 Conflict**
- Email already registered

**500 Internal Server Error**
- Database connection failed
- Unexpected server error

## Testing Endpoints

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+1234567890"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Get current user
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Create POST request to `http://localhost:5000/api/auth/register`
2. Set Body to JSON with user data
3. Send and copy token from response
4. For protected routes, add Header: `Authorization: Bearer <token>`

## Adding New Protected Routes

### Step 1: Create Route Handler
```javascript
// In your route file
router.get("/protected", authMiddleware, (req, res) => {
  res.json({
    message: "User: " + req.user.name,
    user: req.user
  });
});
```

### Step 2: Frontend Uses It
```javascript
// In frontend component
import axiosInstance from '@/lib/axios';

const response = await axiosInstance.get('/protected');
// Token automatically attached!
```

## Security Best Practices

✅ **Do:**
- Use strong JWT_SECRET (random 32+ character string)
- Store JWT_SECRET in .env (not in code)
- Set token expiration (7d default)
- Hash passwords with bcryptjs
- Validate all user inputs
- Use HTTPS in production
- Implement rate limiting

❌ **Don't:**
- Store JWT_SECRET in code/git
- Use simple passwords like "secret"
- Store tokens in cookies without HttpOnly flag
- Accept tokens from untrusted sources
- Log sensitive data

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
```

### MongoDB Connection Fails
```
Check:
- MongoDB is running
- Connection string is correct
- Network access allowed (if MongoDB Atlas)
```

### CORS Errors
```
Check:
- cors() middleware is enabled
- Frontend URL matches CORS configuration
- Requests include proper headers
```

### Token Validation Fails
```
Check:
- JWT_SECRET matches between register and verify
- Token hasn't expired
- Bearer token format is correct
- No extra whitespace in token
```

## Next Steps

1. Test all endpoints with Postman
2. Verify frontend can login/register
3. Check localStorage stores token
4. Test protected routes
5. Implement additional features:
   - Forgot password
   - Email verification
   - Profile update
   - Refresh tokens

## References

- [Express Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Documentation](https://jwt.io/)
- [bcryptjs Documentation](https://github.com/dcodeIO/bcrypt.js)
