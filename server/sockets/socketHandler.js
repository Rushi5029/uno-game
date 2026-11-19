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
      // Emit tailored state to each socket in the room so hand cards are private or shared with teammates
      for (const p of game.players) {
        if (!p.isBot) {
          io.to(p.id).emit('game-state', game.getState(p.id));
        }
      }
      io.to(roomCode).emit('room-info', {
        roomCode,
        playerCount: game.players.length,
        status: game.status,
        gameMode: game.gameMode,
        messages: room.messages
      });
    };

    const triggerBotTurnsIfNeeded = (roomCode) => {
      const room = roomManager.getRoom(roomCode);
      if (!room || room.game.status !== 'playing') return;

      const game = room.game;
      const curPlayer = game.getCurrentPlayer();
      if (!curPlayer || !curPlayer.isBot) return;

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
            triggerBotTurnsIfNeeded(roomCode);
          }
        } catch (err) {
          console.error('Bot move error:', err);
        }
      }, 1200);
    };

    const handleGameWin = async (game, roomCode) => {
      try {
        const winningTeamId = game.winningTeam?.id;
        // In team play, all players on winning team get recorded as winners!
        for (const player of game.players) {
          const isWinner = game.gameMode === 'team' && winningTeamId
            ? player.teamId === winningTeamId
            : player.username.toLowerCase() === game.winner.username.toLowerCase();

          const existing = await dbService.findUser(player.username);
          const wins = (existing?.wins || 0) + (isWinner ? 1 : 0);
          const losses = (existing?.losses || 0) + (isWinner ? 0 : 1);
          const gamesPlayed = (existing?.gamesPlayed || 0) + 1;
          const score = (existing?.score || 0) + (isWinner ? 50 : 10);
          await dbService.saveOrUpdateUser({
            username: player.username,
            avatar: player.avatar || existing?.avatar || 'avatar-1',
            wins,
            losses,
            gamesPlayed,
            score
          });
        }

        const top10 = await dbService.getLeaderboard(10);
        io.emit('leaderboard-updated', top10);
      } catch (err) {
        console.error('Error saving game stats:', err);
      }

      io.to(roomCode).emit('game-over', {
        winner: game.winner,
        winningTeam: game.winningTeam,
        gameMode: game.gameMode,
        players: game.players.map((p) => ({
          username: p.username,
          avatar: p.avatar,
          teamId: p.teamId,
          cardCount: p.hand.length
        }))
      });
    };

    // 1. Join or Create Room
    socket.on('join-room', async ({ roomCode, username, avatar, gameMode, teamCount }) => {
      try {
        if (!username || !username.trim()) {
          return socket.emit('error-msg', 'Username is required');
        }

        const code = roomCode ? roomCode.trim().toUpperCase() : null;
        let room = code ? roomManager.getRoom(code) : null;

        if (!room) {
          const game = roomManager.createRoom({
            roomCode: code,
            gameMode: gameMode || 'solo',
            teamCount: teamCount || 2
          });
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

        roomManager.addMessage(game.roomCode, {
          sender: 'System',
          text: `${player.username} joined the table!`,
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

    // Game Mode Switch (Solo vs Team Play)
    socket.on('set-game-mode', ({ mode, teamCount }) => {
      if (!currentRoomCode) return;
      const room = roomManager.getRoom(currentRoomCode);
      if (!room) return;

      const player = room.game.players.find((p) => p.id === socket.id);
      if (!player || !player.isHost) return;

      room.game.setGameMode(mode, teamCount || 2);
      roomManager.addMessage(currentRoomCode, {
        sender: 'System',
        text: `Game Mode changed to ${mode === 'team' ? 'TEAM PLAY' : 'SOLO'} (${room.game.teamCount} Teams)`,
        isSystem: true
      });
      broadcastRoomState(currentRoomCode);
    });

    // Player Selects Team
    socket.on('switch-team', ({ teamId }) => {
      if (!currentRoomCode) return;
      const room = roomManager.getRoom(currentRoomCode);
      if (!room) return;

      room.game.assignPlayerTeam(socket.id, teamId);
      broadcastRoomState(currentRoomCode);
    });

    // Host Auto-balances Teams
    socket.on('auto-balance-teams', () => {
      if (!currentRoomCode) return;
      const room = roomManager.getRoom(currentRoomCode);
      if (!room) return;

      const player = room.game.players.find((p) => p.id === socket.id);
      if (!player || !player.isHost) return;

      room.game.autoAssignTeams();
      broadcastRoomState(currentRoomCode);
    });

    // Start Game
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
          text: `Game started in ${room.game.gameMode.toUpperCase()} mode!`,
          isSystem: true
        });
        broadcastRoomState(currentRoomCode);
        triggerBotTurnsIfNeeded(currentRoomCode);
      } catch (err) {
        socket.emit('error-msg', err.message);
      }
    });

    // Play Card
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

    // Draw Card
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

    // Pass Turn
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

    // Call UNO
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

    // Catch UNO
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

    // Add Bot
    socket.on('add-bot', () => {
      if (!currentRoomCode) return;
      const room = roomManager.getRoom(currentRoomCode);
      if (!room) return;

      const player = room.game.players.find((p) => p.id === socket.id);
      if (!player || !player.isHost) return;

      const bot = room.game.addBot();
      if (bot) {
        broadcastRoomState(currentRoomCode);
      }
    });

    // Remove Bot
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

    // Chat Message
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

    // Quick Emoji Reaction
    socket.on('send-reaction', ({ emoji }) => {
      if (!currentRoomCode || !emoji) return;
      io.to(currentRoomCode).emit('player-reaction', {
        username: currentPlayerUsername,
        emoji,
        id: Date.now()
      });
    });

    // Restart Game
    socket.on('restart-game', () => {
      if (!currentRoomCode) return;
      const room = roomManager.getRoom(currentRoomCode);
      if (!room) return;

      const player = room.game.players.find((p) => p.id === socket.id);
      if (!player || !player.isHost) return;

      try {
        room.game.status = 'waiting';
        room.game.winner = null;
        room.game.winningTeam = null;
        room.game.startGame();
        io.to(currentRoomCode).emit('game-restarted');
        broadcastRoomState(currentRoomCode);
        triggerBotTurnsIfNeeded(currentRoomCode);
      } catch (err) {
        socket.emit('error-msg', err.message);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (currentRoomCode) {
        const room = roomManager.getRoom(currentRoomCode);
        if (room) {
          const removed = room.game.removePlayer(socket.id);
          if (removed) {
            roomManager.addMessage(currentRoomCode, {
              sender: 'System',
              text: `${removed.username} left the table.`,
              isSystem: true
            });
            if (room.game.players.filter((p) => !p.isBot).length === 0) {
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
