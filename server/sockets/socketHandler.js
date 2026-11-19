import { roomManager } from '../game/roomManager.js';
import { dbService } from '../config/db.js';

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    let currentRoomCode = null;
    let currentPlayerUsername = null;

    const broadcastRoomState = (roomCode) => {
      const room = roomManager.getRoom(roomCode);
      if (!room) return;

      const game = room.game;
      // Emit tailored state to each socket in the room so hand cards are private
      for (const p of game.players) {
        if (!p.isBot) {
          io.to(p.id).emit('game-state', game.getState(p.id));
        }
      }
      // Also broadcast general state to the room roomCode
      io.to(roomCode).emit('room-info', {
        roomCode,
        playerCount: game.players.length,
        status: game.status,
        messages: room.messages
      });
    };

    const triggerBotTurnsIfNeeded = (roomCode) => {
      const room = roomManager.getRoom(roomCode);
      if (!room || room.game.status !== 'playing') return;

      const game = room.game;
      const curPlayer = game.getCurrentPlayer();
      if (!curPlayer || !curPlayer.isBot) return;

      // Bot thinking delay
      setTimeout(async () => {
        const stillRoom = roomManager.getRoom(roomCode);
        if (!stillRoom || stillRoom.game.status !== 'playing') return;
        if (stillRoom.game.getCurrentPlayer()?.id !== curPlayer.id) return;

        try {
          const moveResult = stillRoom.game.makeBotMove();
          broadcastRoomState(roomCode);

          if (moveResult && moveResult.gameFinished) {
            await handleGameWin(stillRoom.game, roomCode);
          } else {
            // Check if next turn is also a bot
            triggerBotTurnsIfNeeded(roomCode);
          }
        } catch (err) {
          console.error('Bot move error:', err);
        }
      }, 1200);
    };

    const handleGameWin = async (game, roomCode) => {
      try {
        await dbService.recordGameStats(game.winner.username, game.players);
        const top10 = await dbService.getLeaderboard(10);
        io.emit('leaderboard-updated', top10);
      } catch (err) {
        console.error('Error saving game stats:', err);
      }
      io.to(roomCode).emit('game-over', {
        winner: game.winner,
        players: game.players.map((p) => ({
          username: p.username,
          avatar: p.avatar,
          cardCount: p.hand.length
        }))
      });
    };

    // 1. Join or Create Room
    socket.on('join-room', async ({ roomCode, username, avatar }) => {
      try {
        if (!username || !username.trim()) {
          return socket.emit('error-msg', 'Username is required');
        }

        const code = roomCode ? roomCode.trim().toUpperCase() : null;
        let room = code ? roomManager.getRoom(code) : null;

        if (!room) {
          // If code was provided but doesn't exist, create it with that code
          const game = roomManager.createRoom({ roomCode: code });
          room = roomManager.getRoom(game.roomCode);
        }

        const game = room.game;
        const player = game.addPlayer({
          id: socket.id,
          username: username.trim(),
          avatar: avatar || 'avatar-1'
        });

        currentRoomCode = game.roomCode;
        currentPlayerUsername = player.username;

        socket.join(game.roomCode);

        // System message
        roomManager.addMessage(game.roomCode, {
          sender: 'System',
          text: `${player.username} joined the game!`,
          isSystem: true
        });

        socket.emit('joined-successfully', {
          roomCode: game.roomCode,
          player,
          isHost: player.isHost
        });

        broadcastRoomState(game.roomCode);
      } catch (err) {
        socket.emit('error-msg', err.message);
      }
    });

    // 2. Start Game (Host only)
    socket.on('start-game', () => {
      if (!currentRoomCode) return;
      const room = roomManager.getRoom(currentRoomCode);
      if (!room) return;

      const player = room.game.players.find((p) => p.id === socket.id);
      if (!player || !player.isHost) {
        return socket.emit('error-msg', 'Only the host can start the game.');
      }

      try {
        room.game.startGame();
        roomManager.addMessage(currentRoomCode, {
          sender: 'System',
          text: `Game has started! Good luck to all players!`,
          isSystem: true
        });
        broadcastRoomState(currentRoomCode);
        triggerBotTurnsIfNeeded(currentRoomCode);
      } catch (err) {
        socket.emit('error-msg', err.message);
      }
    });

    // 3. Play Card
    socket.on('play-card', async ({ cardId, chosenColor, willCallUno }) => {
      if (!currentRoomCode) return;
      const room = roomManager.getRoom(currentRoomCode);
      if (!room) return;

      try {
        const result = room.game.playCard(socket.id, cardId, chosenColor, willCallUno);
        broadcastRoomState(currentRoomCode);

        if (result.gameFinished) {
          await handleGameWin(room.game, currentRoomCode);
        } else {
          triggerBotTurnsIfNeeded(currentRoomCode);
        }
      } catch (err) {
        socket.emit('error-msg', err.message);
      }
    });

    // 4. Draw Card
    socket.on('draw-card', () => {
      if (!currentRoomCode) return;
      const room = roomManager.getRoom(currentRoomCode);
      if (!room) return;

      try {
        const result = room.game.drawCard(socket.id);
        socket.emit('card-drawn', result);
        broadcastRoomState(currentRoomCode);
        triggerBotTurnsIfNeeded(currentRoomCode);
      } catch (err) {
        socket.emit('error-msg', err.message);
      }
    });

    // 5. Pass Turn (after drawing)
    socket.on('pass-turn', () => {
      if (!currentRoomCode) return;
      const room = roomManager.getRoom(currentRoomCode);
      if (!room) return;

      try {
        room.game.passTurn(socket.id);
        broadcastRoomState(currentRoomCode);
        triggerBotTurnsIfNeeded(currentRoomCode);
      } catch (err) {
        socket.emit('error-msg', err.message);
      }
    });

    // 6. Call UNO!
    socket.on('call-uno', () => {
      if (!currentRoomCode) return;
      const room = roomManager.getRoom(currentRoomCode);
      if (!room) return;

      const success = room.game.callUno(socket.id);
      if (success) {
        io.to(currentRoomCode).emit('uno-shouted', {
          username: currentPlayerUsername
        });
        broadcastRoomState(currentRoomCode);
      }
    });

    // 7. Catch UNO! (Challenge player who forgot)
    socket.on('catch-uno', () => {
      if (!currentRoomCode) return;
      const room = roomManager.getRoom(currentRoomCode);
      if (!room) return;

      const res = room.game.catchUno(socket.id);
      if (res.success) {
        io.to(currentRoomCode).emit('uno-caught', res);
        broadcastRoomState(currentRoomCode);
      } else {
        socket.emit('error-msg', res.message || 'Cannot catch UNO right now.');
      }
    });

    // 8. Add Bot
    socket.on('add-bot', () => {
      if (!currentRoomCode) return;
      const room = roomManager.getRoom(currentRoomCode);
      if (!room) return;

      const player = room.game.players.find((p) => p.id === socket.id);
      if (!player || !player.isHost) return;

      const bot = room.game.addBot();
      if (bot) {
        roomManager.addMessage(currentRoomCode, {
          sender: 'System',
          text: `${bot.username} (AI) joined the room.`,
          isSystem: true
        });
        broadcastRoomState(currentRoomCode);
      }
    });

    // 9. Remove Bot
    socket.on('remove-bot', ({ botId }) => {
      if (!currentRoomCode) return;
      const room = roomManager.getRoom(currentRoomCode);
      if (!room) return;

      const player = room.game.players.find((p) => p.id === socket.id);
      if (!player || !player.isHost) return;

      const removed = room.game.removeBot(botId);
      if (removed) {
        broadcastRoomState(currentRoomCode);
      }
    });

    // 10. Chat Message
    socket.on('send-message', ({ text }) => {
      if (!currentRoomCode || !text || !text.trim()) return;
      const room = roomManager.getRoom(currentRoomCode);
      if (!room) return;

      const msg = roomManager.addMessage(currentRoomCode, {
        sender: currentPlayerUsername || 'Player',
        text: text.trim(),
        avatar: room.game.players.find((p) => p.id === socket.id)?.avatar || 'avatar-1'
      });
      io.to(currentRoomCode).emit('chat-message', msg);
    });

    // 11. Quick Emoji Reaction
    socket.on('send-reaction', ({ emoji }) => {
      if (!currentRoomCode || !emoji) return;
      io.to(currentRoomCode).emit('player-reaction', {
        username: currentPlayerUsername,
        emoji,
        id: Date.now()
      });
    });

    // 12. Restart Game
    socket.on('restart-game', () => {
      if (!currentRoomCode) return;
      const room = roomManager.getRoom(currentRoomCode);
      if (!room) return;

      const player = room.game.players.find((p) => p.id === socket.id);
      if (!player || !player.isHost) return;

      try {
        room.game.status = 'waiting';
        room.game.winner = null;
        room.game.startGame();
        io.to(currentRoomCode).emit('game-restarted');
        broadcastRoomState(currentRoomCode);
        triggerBotTurnsIfNeeded(currentRoomCode);
      } catch (err) {
        socket.emit('error-msg', err.message);
      }
    });

    // 13. Disconnect / Leave
    socket.on('disconnect', () => {
      if (currentRoomCode) {
        const room = roomManager.getRoom(currentRoomCode);
        if (room) {
          const removed = room.game.removePlayer(socket.id);
          if (removed) {
            roomManager.addMessage(currentRoomCode, {
              sender: 'System',
              text: `${removed.username} left the game.`,
              isSystem: true
            });
            if (room.game.players.filter((p) => !p.isBot).length === 0) {
              // Clean up empty room
              roomManager.deleteRoom(currentRoomCode);
            } else {
              broadcastRoomState(currentRoomCode);
              triggerBotTurnsIfNeeded(currentRoomCode);
            }
          }
        }
      }
    });
  });
}
