import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([]));
}

let isMongoConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uno_game';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500
    });
    isMongoConnected = true;
    console.log(`[Database] Connected to MongoDB: ${mongoose.connection.host}`);
  } catch (err) {
    isMongoConnected = false;
    console.warn(`[Database] MongoDB not reachable (${err.message}). Using local JSON fallback storage in server/data/.`);
    console.warn(`[Database] To use MongoDB, set MONGODB_URI in .env or run local MongoDB.`);
  }
};

// Fallback JSON DB helpers
const readJson = (filePath) => {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const writeJson = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error saving to ${filePath}:`, err);
  }
};

// Unified Data Access Layer (handles Mongo or Local JSON transparently)
export const dbService = {
  async findUser(username) {
    if (isMongoConnected) {
      const User = (await import('../models/User.js')).default;
      return await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
    }
    const users = readJson(USERS_FILE);
    return users.find((u) => u.username.toLowerCase() === username.toLowerCase()) || null;
  },

  async saveOrUpdateUser(userData) {
    if (isMongoConnected) {
      const User = (await import('../models/User.js')).default;
      return await User.findOneAndUpdate(
        { username: new RegExp(`^${userData.username}$`, 'i') },
        { ...userData, lastActive: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    const users = readJson(USERS_FILE);
    const index = users.findIndex(
      (u) => u.username.toLowerCase() === userData.username.toLowerCase()
    );
    let updated;
    if (index >= 0) {
      updated = {
        ...users[index],
        ...userData,
        lastActive: new Date().toISOString()
      };
      users[index] = updated;
    } else {
      updated = {
        id: Date.now().toString(),
        username: userData.username,
        avatar: userData.avatar || 'avatar-1',
        gamesPlayed: userData.gamesPlayed || 0,
        wins: userData.wins || 0,
        losses: userData.losses || 0,
        score: userData.score || 0,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
      users.push(updated);
    }
    writeJson(USERS_FILE, users);
    return updated;
  },

  async getLeaderboard(limit = 10) {
    if (isMongoConnected) {
      const User = (await import('../models/User.js')).default;
      const topUsers = await User.find()
        .sort({ wins: -1, gamesPlayed: -1, score: -1 })
        .limit(limit);
      return topUsers.map((u, i) => ({
        rank: i + 1,
        username: u.username,
        avatar: u.avatar,
        wins: u.wins,
        losses: u.losses,
        gamesPlayed: u.gamesPlayed,
        winRate: u.gamesPlayed > 0 ? Math.round((u.wins / u.gamesPlayed) * 100) : 0,
        score: u.score
      }));
    }
    const users = readJson(USERS_FILE);
    const sorted = [...users].sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
      return (b.score || 0) - (a.score || 0);
    });
    return sorted.slice(0, limit).map((u, i) => ({
      rank: i + 1,
      username: u.username,
      avatar: u.avatar,
      wins: u.wins,
      losses: u.losses,
      gamesPlayed: u.gamesPlayed,
      winRate: u.gamesPlayed > 0 ? Math.round((u.wins / u.gamesPlayed) * 100) : 0,
      score: u.score || 0
    }));
  },

  async recordGameStats(winnerUsername, allPlayers) {
    for (const player of allPlayers) {
      const isWinner = player.username.toLowerCase() === winnerUsername.toLowerCase();
      const existing = await this.findUser(player.username);
      const wins = (existing?.wins || 0) + (isWinner ? 1 : 0);
      const losses = (existing?.losses || 0) + (isWinner ? 0 : 1);
      const gamesPlayed = (existing?.gamesPlayed || 0) + 1;
      const score = (existing?.score || 0) + (isWinner ? 50 : 10);
      await this.saveOrUpdateUser({
        username: player.username,
        avatar: player.avatar || existing?.avatar || 'avatar-1',
        wins,
        losses,
        gamesPlayed,
        score
      });
    }
  }
};
