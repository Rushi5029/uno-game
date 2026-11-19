import express from 'express';
import { dbService } from '../config/db.js';

const router = express.Router();

// Simple username login (no password needed)
router.post('/login', async (req, res) => {
  try {
    const { username, avatar } = req.body;
    if (!username || username.trim().length < 2) {
      return res.status(400).json({ error: 'Username must be at least 2 characters long' });
    }

    const cleanUsername = username.trim();
    let user = await dbService.findUser(cleanUsername);

    if (!user) {
      user = await dbService.saveOrUpdateUser({
        username: cleanUsername,
        avatar: avatar || 'avatar-1',
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        score: 0
      });
    } else if (avatar && avatar !== user.avatar) {
      user = await dbService.saveOrUpdateUser({
        username: cleanUsername,
        avatar
      });
    }

    // Determine current rank from leaderboard
    const leaderboard = await dbService.getLeaderboard(50);
    const userRankIndex = leaderboard.findIndex(
      (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    const rank = userRankIndex >= 0 ? userRankIndex + 1 : null;

    res.json({
      user: {
        username: user.username,
        avatar: user.avatar,
        gamesPlayed: user.gamesPlayed || 0,
        wins: user.wins || 0,
        losses: user.losses || 0,
        score: user.score || 0,
        winRate: user.gamesPlayed > 0 ? Math.round((user.wins / user.gamesPlayed) * 100) : 0,
        rank
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Update profile (avatar, etc.)
router.put('/profile', async (req, res) => {
  try {
    const { username, avatar } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    const updated = await dbService.saveOrUpdateUser({
      username: username.trim(),
      avatar
    });
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// Get user profile by username
router.get('/profile/:username', async (req, res) => {
  try {
    const user = await dbService.findUser(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const leaderboard = await dbService.getLeaderboard(50);
    const userRankIndex = leaderboard.findIndex(
      (u) => u.username.toLowerCase() === user.username.toLowerCase()
    );

    res.json({
      user: {
        username: user.username,
        avatar: user.avatar,
        gamesPlayed: user.gamesPlayed || 0,
        wins: user.wins || 0,
        losses: user.losses || 0,
        winRate: user.gamesPlayed > 0 ? Math.round((user.wins / user.gamesPlayed) * 100) : 0,
        score: user.score || 0,
        rank: userRankIndex >= 0 ? userRankIndex + 1 : null
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error getting profile' });
  }
});

export default router;
