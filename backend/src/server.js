import express from 'express';
import cors from 'cors';
import { db } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 1. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Unique Username Form API is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// 2. Get list of all registered usernames
app.get('/api/users', (req, res) => {
  try {
    const usernames = db.getAllUsernames();
    res.json({
      success: true,
      count: usernames.length,
      usernames,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 3. Real-time debounced username availability check
app.get('/api/check-username', (req, res) => {
  const username = req.query.username;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({
      available: false,
      error: 'Username query parameter is required.',
    });
  }

  const cleanUsername = username.trim();

  // Validate format
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(cleanUsername)) {
    let reason = 'Must be 3 to 20 characters (letters, numbers, underscores only).';
    if (cleanUsername.length < 3) reason = 'Username must be at least 3 characters.';
    if (cleanUsername.length > 20) reason = 'Username must not exceed 20 characters.';

    return res.json({
      available: false,
      username: cleanUsername,
      message: reason,
      invalidFormat: true,
    });
  }

  const isTaken = db.isUsernameTaken(cleanUsername);

  if (isTaken) {
    return res.json({
      available: false,
      username: cleanUsername,
      message: `@${cleanUsername} is already taken. Please choose another.`,
    });
  }

  return res.json({
    available: true,
    username: cleanUsername,
    message: `@${cleanUsername} is available!`,
  });
});

// 4. Registration endpoint
app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body || {};

  // Validate fields
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'All fields (username, email, password) are required.',
    });
  }

  const cleanUsername = String(username).trim();
  const cleanEmail = String(email).trim();

  // Username validation
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(cleanUsername)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid username format. Must be 3-20 alphanumeric characters or underscores.',
    });
  }

  // Email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid email address.',
    });
  }

  // Password validation
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters long.',
    });
  }

  try {
    const newUser = db.createUser({
      username: cleanUsername,
      email: cleanEmail,
      password,
    });

    return res.status(201).json({
      success: true,
      message: 'Account successfully registered!',
      user: newUser,
    });
  } catch (error) {
    if (error.code === 'USERNAME_EXISTS') {
      return res.status(409).json({
        success: false,
        error: error.message,
      });
    }

    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while creating your account.',
    });
  }
});

// 5. Reset endpoint for testing
app.post('/api/reset', (req, res) => {
  try {
    const result = db.reset();
    res.json({
      success: true,
      message: 'Database has been reset to default seed users.',
      usernames: result.users.map((u) => u.username),
    });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset database.' });
  }
});

// Start server
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});

export { app, server };
