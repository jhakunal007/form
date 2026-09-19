import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'users.json');

// const DEFAULT_SEED_USERNAMES = [
//   'admin',
//   'alex',
//   'sarah_k',
//   'johndoe',
//   'developer',
//   'crypto_king',
//   'nova_user',
// ];

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function generateInitialSeedUsers() {
  const defaultPasswordHash = bcrypt.hashSync('SamplePass#2026', 10);
  return DEFAULT_SEED_USERNAMES.map((username, index) => ({
    id: `usr_${index + 1}`,
    username,
    email: `${username.toLowerCase()}@example.com`,
    passwordHash: defaultPasswordHash,
    createdAt: new Date(Date.now() - (DEFAULT_SEED_USERNAMES.length - index) * 3600000).toISOString(),
  }));
}

export class Database {
  constructor() {
    ensureDataDirectory();
    if (!fs.existsSync(DB_PATH)) {
      this.reset();
    }
  }

  _read() {
    try {
      if (!fs.existsSync(DB_PATH)) {
        return this.reset();
      }
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('Error reading DB, re-initializing...', err);
      return this.reset();
    }
  }

  _write(data) {
    ensureDataDirectory();
    // Atomic write via temp file
    const tempPath = `${DB_PATH}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_PATH);
  }

  reset() {
    const seedUsers = generateInitialSeedUsers();
    this._write({ users: seedUsers });
    return { users: seedUsers };
  }

  getAllUsers() {
    const data = this._read();
    return data.users || [];
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

    const data = this._read();
    data.users.unshift(newUser);
    this._write(data);

    // Return sanitized user object without passwordHash
    return {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };
  }
}

export const db = new Database();
