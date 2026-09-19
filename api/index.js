import express from 'express';
import cors from 'cors';
import { serverlessDb } from './db.js';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

const router = express.Router();

// 1. Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: 'vercel-serverless',
    timestamp: new Date().toISOString(),
  });
});

// 2. Get registered usernames
router.get('/users', (req, res) => {
  try {
    const usernames = serverlessDb.getAllUsernames();
    res.json({
      success: true,
      count: usernames.length,
      usernames,
    });
  } catch (error) {
    console.error('Error in /users:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 3. Debounced username availability check
router.get('/check-username', (req, res) => {
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

  const isTaken = serverlessDb.isUsernameTaken(cleanUsername);

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

// 4. Register account
router.post('/register', (req, res) => {
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'All fields (username, email, password) are required.',
    });
  }

  const cleanUsername = String(username).trim();
  const cleanEmail = String(email).trim();

  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(cleanUsername)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid username format. Must be 3-20 alphanumeric characters or underscores.',
    });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid email address.',
    });
  }

  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters long.',
    });
  }

  try {
    const newUser = serverlessDb.createUser({
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

// 5. Reset endpoint
router.post('/reset', (req, res) => {
  try {
    const result = serverlessDb.reset();
    res.json({
      success: true,
      message: 'Database reset to default seed users.',
      usernames: result.users.map((u) => u.username),
    });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset database.' });
  }
});

// Support both /api/... and /... routes on Vercel
app.use('/api', router);
app.use('/', router);

export default app;
