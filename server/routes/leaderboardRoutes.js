import express from 'express';
import { dbService } from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaders = await dbService.getLeaderboard(limit);

    // Format with badges for top ranks
    const formatted = leaders.map((player, index) => {
      let badge = null;
      if (player.wins > 0 || player.gamesPlayed > 0) {
        if (index === 0) badge = { text: '1st Rank', type: 'gold', icon: 'crown' };
        else if (index === 1) badge = { text: '2nd Rank', type: 'silver', icon: 'medal' };
        else if (index === 2) badge = { text: '3rd Rank', type: 'bronze', icon: 'medal' };
      }
      return {
        ...player,
        badge
      };
    });

    res.json({ leaderboard: formatted });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to retrieve leaderboard' });
  }
});

export default router;
