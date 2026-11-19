import mongoose from 'mongoose';

const gameHistorySchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true
    },
    winner: {
      type: String,
      required: true
    },
    players: [
      {
        username: String,
        cardsLeft: Number,
        rank: Number
      }
    ],
    durationSeconds: {
      type: Number,
      default: 0
    },
    totalTurns: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const GameHistory = mongoose.model('GameHistory', gameHistorySchema);
export default GameHistory;
