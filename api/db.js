import fs from 'fs';
import path from 'path';
import os from 'os';
import bcrypt from 'bcryptjs';

const DEFAULT_SEED_USERNAMES = [
  'admin',
  'alex',
  'sarah_k',
  'johndoe',
  'developer',
  'crypto_king',
  'nova_user',
];

function generateSeedUsers() {
  const defaultPasswordHash = bcrypt.hashSync('SamplePass#2026', 10);
  return DEFAULT_SEED_USERNAMES.map((username, index) => ({
    id: `usr_${index + 1}`,
    username,
    email: `${username.toLowerCase()}@example.com`,
    passwordHash: defaultPasswordHash,
    createdAt: new Date(Date.now() - (DEFAULT_SEED_USERNAMES.length - index) * 3600000).toISOString(),
  }));
}

// Global in-memory cache to ensure warm serverless invocations stay synced
let memoryStore = null;

// Determine writable database path: /tmp for serverless/Vercel, local fallback
function getDbFilePath() {
  const tmpDir = os.tmpdir();
  return path.join(tmpDir, 'unique_form_users_v1.json');
}

export class ServerlessDatabase {
  constructor() {
    this.dbPath = getDbFilePath();
    this._init();
  }

  _init() {
    if (!memoryStore) {
      try {
        if (fs.existsSync(this.dbPath)) {
          const content = fs.readFileSync(this.dbPath, 'utf-8');
          memoryStore = JSON.parse(content);
        }
      } catch (e) {
        console.warn('Could not read existing temp DB, initializing default seed:', e.message);
      }

      if (!memoryStore || !Array.isArray(memoryStore.users) || memoryStore.users.length === 0) {
        this.reset();
      }
    }
  }

  _persist() {
    try {
      if (memoryStore) {
        fs.writeFileSync(this.dbPath, JSON.stringify(memoryStore, null, 2), 'utf-8');
      }
    } catch (e) {
      // If filesystem writing fails in restricted environments, memoryStore still serves the request
      console.warn('Warning: Could not persist to tmp file system:', e.message);
    }
  }

  reset() {
    const seed = generateSeedUsers();
    memoryStore = { users: seed };
    this._persist();
    return memoryStore;
  }

  getAllUsers() {
    this._init();
    return memoryStore.users || [];
  }

  getAllUsernames() {
    const users = this.getAllUsers();
    return users.map((u) => u.username);
  }

  isUsernameTaken(username) {
    if (!username) return false;
    const clean = username.trim().toLowerCase();
    const users = this.getAllUsers();
    return users.some((u) => u.username.toLowerCase() === clean);
  }

  createUser({ username, email, password }) {
    this._init();
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (this.isUsernameTaken(cleanUsername)) {
      const err = new Error(`Username '@${cleanUsername}' is already taken.`);
      err.code = 'USERNAME_EXISTS';
      throw err;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    memoryStore.users.unshift(newUser);
    this._persist();

    return {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };
  }
}

export const serverlessDb = new ServerlessDatabase();
