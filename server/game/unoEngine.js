import { createDeck, shuffleDeck, COLORS } from './deck.js';

export const TEAMS_CONFIG = [
  { id: 'team_red', name: 'Team Crimson', color: '#ef4444', bg: 'bg-red-500/20', border: 'border-red-500' },
  { id: 'team_blue', name: 'Team Cobalt', color: '#3b82f6', bg: 'bg-blue-500/20', border: 'border-blue-500' },
  { id: 'team_green', name: 'Team Emerald', color: '#10b981', bg: 'bg-emerald-500/20', border: 'border-emerald-500' },
  { id: 'team_yellow', name: 'Team Gold', color: '#f59e0b', bg: 'bg-amber-500/20', border: 'border-amber-500' }
];

export class UnoGame {
  constructor(roomCode, options = {}) {
    this.roomCode = roomCode;
    this.maxPlayers = options.maxPlayers || 10;
    this.gameMode = options.gameMode || 'solo'; // 'solo' or 'team'
    this.teamCount = options.teamCount || 2; // 2, 3, or 4 teams
    this.players = []; // { id, username, avatar, hand: [], hasCalledUno: false, isHost: false, isBot: false, teamId: null }
    this.drawPile = [];
    this.discardPile = [];
    this.currentTurnIndex = 0;
    this.direction = 1; // 1 = clockwise, -1 = counter-clockwise
    this.currentColor = null;
    this.status = 'waiting'; // 'waiting', 'playing', 'finished'
    this.winner = null; // { id, username, avatar, teamId }
    this.winningTeam = null; // { id, name, color }
    this.turnTimeLimit = 30; // seconds
    this.unoVulnerablePlayerId = null;
    this.lastAction = null;
    this.turnCount = 0;
    this.drawnCardThisTurn = null;
  }

  setGameMode(mode, teamCount = 2) {
    if (this.status !== 'waiting') return;
    this.gameMode = mode;
    this.teamCount = Math.max(2, Math.min(4, teamCount));
    this.autoAssignTeams();
  }

  assignPlayerTeam(playerId, teamId) {
    if (this.status !== 'waiting') return;
    const player = this.players.find((p) => p.id === playerId);
    if (player) {
      player.teamId = teamId;
    }
  }

  autoAssignTeams() {
    if (this.gameMode !== 'team') {
      this.players.forEach((p) => (p.teamId = null));
      return;
    }
    const availableTeams = TEAMS_CONFIG.slice(0, this.teamCount);
    this.players.forEach((p, idx) => {
      p.teamId = availableTeams[idx % availableTeams.length].id;
    });
  }

  addPlayer(player) {
    if (this.players.length >= this.maxPlayers) {
      throw new Error('Room is full (max ' + this.maxPlayers + ' players)');
    }
    if (this.status !== 'waiting') {
      throw new Error('Game already in progress');
    }
    const existingIndex = this.players.findIndex(
      (p) => p.username.toLowerCase() === player.username.toLowerCase()
    );
    if (existingIndex !== -1) {
      this.players[existingIndex].id = player.id;
      return this.players[existingIndex];
    }

    const availableTeams = TEAMS_CONFIG.slice(0, this.teamCount);
    const assignedTeam = this.gameMode === 'team'
      ? availableTeams[this.players.length % availableTeams.length].id
      : null;

    const newPlayer = {
      id: player.id,
      username: player.username,
      avatar: player.avatar || 'avatar-1',
      hand: [],
      hasCalledUno: false,
      isHost: this.players.length === 0,
      isReady: false,
      isBot: Boolean(player.isBot),
      teamId: assignedTeam,
      score: 0
    };
    this.players.push(newPlayer);
    return newPlayer;
  }

  removePlayer(playerId) {
    const index = this.players.findIndex((p) => p.id === playerId);
    if (index === -1) return null;
    const removed = this.players.splice(index, 1)[0];

    if (removed.isHost && this.players.length > 0) {
      this.players[0].isHost = true;
    }

    if (this.status === 'playing') {
      if (this.players.length < 2) {
        this.status = 'waiting';
        this.lastAction = {
          text: `${removed.username} left. Not enough players to continue.`,
          type: 'info'
        };
      } else {
        if (this.currentTurnIndex >= this.players.length) {
          this.currentTurnIndex = 0;
        }
      }
    }
    return removed;
  }

  addBot() {
    if (this.players.length >= this.maxPlayers || this.status !== 'waiting') return null;
    const botNum = this.players.filter((p) => p.isBot).length + 1;
    const botNames = ['RoboUno', 'PixelBot', 'CyberAce', 'ByteMaster', 'MegaBot', 'TurboDeck', 'NeonStar', 'ShadowBot'];
    const botName = botNames[botNum - 1] || `Bot_${botNum}`;
    const botAvatars = ['avatar-2', 'avatar-3', 'avatar-4', 'avatar-5', 'avatar-6', 'avatar-7'];

    const availableTeams = TEAMS_CONFIG.slice(0, this.teamCount);
    const assignedTeam = this.gameMode === 'team'
      ? availableTeams[this.players.length % availableTeams.length].id
      : null;

    const bot = {
      id: `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: botName,
      avatar: botAvatars[(botNum - 1) % botAvatars.length],
      hand: [],
      hasCalledUno: false,
      isHost: false,
      isReady: true,
      isBot: true,
      teamId: assignedTeam,
      score: 0
    };
    this.players.push(bot);
    return bot;
  }

  removeBot(botId) {
    if (this.status !== 'waiting') return false;
    const idx = this.players.findIndex((p) => p.id === botId && p.isBot);
    if (idx !== -1) {
      this.players.splice(idx, 1);
      return true;
    }
    return false;
  }

  startGame() {
    if (this.players.length < 2) {
      throw new Error('Minimum 2 players required to start');
    }

    // In team play, alternate seating order so teams take alternating turns!
    if (this.gameMode === 'team') {
      const teams = {};
      this.players.forEach((p) => {
        const tId = p.teamId || TEAMS_CONFIG[0].id;
        if (!teams[tId]) teams[tId] = [];
        teams[tId].push(p);
      });
      const teamKeys = Object.keys(teams);
      const reordered = [];
      let maxLen = Math.max(...teamKeys.map((k) => teams[k].length));
      for (let i = 0; i < maxLen; i++) {
        for (const k of teamKeys) {
          if (teams[k][i]) reordered.push(teams[k][i]);
        }
      }
      this.players = reordered;
    }

    // 1. Prepare deck
    this.drawPile = shuffleDeck(createDeck());
    this.discardPile = [];
    this.status = 'playing';
    this.winner = null;
    this.winningTeam = null;
    this.direction = 1;
    this.currentTurnIndex = 0;
    this.turnCount = 0;
    this.unoVulnerablePlayerId = null;
    this.drawnCardThisTurn = null;

    // 2. Deal 7 cards to each player
    for (const player of this.players) {
      player.hand = this.drawPile.splice(0, 7);
      player.hasCalledUno = false;
    }

    // 3. Flip starting card
    let firstCard = this.drawPile.pop();
    while (firstCard.value === 'wild_draw4') {
      this.drawPile.unshift(firstCard);
      firstCard = this.drawPile.pop();
    }
    this.discardPile.push(firstCard);
    this.currentColor = firstCard.color === 'wild' ? COLORS[Math.floor(Math.random() * 4)] : firstCard.color;

    this.applyInitialCardEffect(firstCard);

    this.lastAction = {
      text: `Game started! Starting card is ${firstCard.color.toUpperCase()} ${firstCard.value.toUpperCase()}.`,
      type: 'start'
    };

    return this.getState();
  }

  applyInitialCardEffect(card) {
    const curPlayer = this.players[this.currentTurnIndex];
    if (card.value === 'skip') {
      this.advanceTurn(1);
    } else if (card.value === 'reverse') {
      if (this.players.length === 2) {
        this.advanceTurn(1);
      } else {
        this.direction *= -1;
      }
    } else if (card.value === 'draw2') {
      this.drawCardsForPlayer(curPlayer, 2);
      this.advanceTurn(1);
    }
  }

  getTopDiscard() {
    return this.discardPile[this.discardPile.length - 1];
  }

  getCurrentPlayer() {
    return this.players[this.currentTurnIndex];
  }

  reshuffleDiscardPileIfNeeded() {
    if (this.drawPile.length < 5 && this.discardPile.length > 1) {
      const top = this.discardPile.pop();
      const recycled = shuffleDeck(this.discardPile);
      this.drawPile.unshift(...recycled);
      this.discardPile = [top];
    }
  }

  drawCardsForPlayer(player, count) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      this.reshuffleDiscardPileIfNeeded();
      if (this.drawPile.length > 0) {
        const card = this.drawPile.pop();
        player.hand.push(card);
        drawn.push(card);
      }
    }
    return drawn;
  }

  canPlayCard(card) {
    const top = this.getTopDiscard();
    if (!top) return true;
    if (card.color === 'wild') return true;
    if (card.color === this.currentColor) return true;
    if (card.value === top.value) return true;
    return false;
  }

  advanceTurn(steps = 1) {
    const n = this.players.length;
    this.currentTurnIndex = (this.currentTurnIndex + (this.direction * steps) % n + n) % n;
    this.turnCount++;
    this.drawnCardThisTurn = null;
  }

  playCard(playerId, cardId, chosenColor = null, willCallUno = false) {
    if (this.status !== 'playing') {
      throw new Error('Game is not in progress');
    }
    const curPlayer = this.getCurrentPlayer();
    if (curPlayer.id !== playerId) {
      throw new Error("It is not your turn!");
    }

    const cardIndex = curPlayer.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      throw new Error('Card not in your hand');
    }
    const card = curPlayer.hand[cardIndex];

    if (!this.canPlayCard(card)) {
      throw new Error('This card cannot be played on the current discard card.');
    }

    if (card.color === 'wild') {
      if (!chosenColor || !COLORS.includes(chosenColor)) {
        throw new Error('Please choose a valid color (red, yellow, green, or blue).');
      }
    }

    curPlayer.hand.splice(cardIndex, 1);
    this.discardPile.push(card);

    if (card.color === 'wild') {
      this.currentColor = chosenColor;
    } else {
      this.currentColor = card.color;
    }

    // UNO! rule
    if (curPlayer.hand.length === 1) {
      if (willCallUno || curPlayer.hasCalledUno) {
        curPlayer.hasCalledUno = true;
        this.unoVulnerablePlayerId = null;
        this.lastAction = {
          text: `🔥 ${curPlayer.username} yelled "UNO!" with 1 card left!`,
          type: 'uno'
        };
      } else {
        this.unoVulnerablePlayerId = curPlayer.id;
        this.lastAction = {
          text: `⚠️ ${curPlayer.username} has 1 card left without yelling UNO!`,
          type: 'warning'
        };
      }
    } else {
      curPlayer.hasCalledUno = false;
      this.unoVulnerablePlayerId = null;
    }

    // VICTORY CHECK
    if (curPlayer.hand.length === 0) {
      this.status = 'finished';
      this.winner = curPlayer;
      if (this.gameMode === 'team' && curPlayer.teamId) {
        this.winningTeam = TEAMS_CONFIG.find((t) => t.id === curPlayer.teamId);
        this.lastAction = {
          text: `🏆 ${curPlayer.username} and ${this.winningTeam?.name || 'their team'} WON THE GAME!`,
          type: 'win'
        };
      } else {
        this.lastAction = {
          text: `🏆 ${curPlayer.username} WON THE GAME!`,
          type: 'win'
        };
      }
      return { success: true, gameFinished: true, winner: curPlayer, winningTeam: this.winningTeam };
    }

    // Action Cards
    let turnSkipSteps = 1;

    if (card.value === 'skip') {
      turnSkipSteps = 2;
      const skippedPlayer = this.peekNextPlayer(1);
      this.lastAction = {
        text: `🚫 ${curPlayer.username} skipped ${skippedPlayer.username}!`,
        type: 'action'
      };
    } else if (card.value === 'reverse') {
      if (this.players.length === 2) {
        turnSkipSteps = 2;
        this.lastAction = {
          text: `🔄 ${curPlayer.username} reversed! Opponent skipped.`,
          type: 'action'
        };
      } else {
        this.direction *= -1;
        this.lastAction = {
          text: `🔄 Turn direction reversed by ${curPlayer.username}!`,
          type: 'action'
        };
      }
    } else if (card.value === 'draw2') {
      const nextVictim = this.peekNextPlayer(1);
      this.drawCardsForPlayer(nextVictim, 2);
      turnSkipSteps = 2;
      this.lastAction = {
        text: `💥 ${curPlayer.username} hit ${nextVictim.username} with +2 cards!`,
        type: 'action'
      };
    } else if (card.value === 'wild') {
      this.lastAction = {
        text: `🌈 ${curPlayer.username} changed color to ${this.currentColor.toUpperCase()}!`,
        type: 'action'
      };
    } else if (card.value === 'wild_draw4') {
      const nextVictim = this.peekNextPlayer(1);
      this.drawCardsForPlayer(nextVictim, 4);
      turnSkipSteps = 2;
      this.lastAction = {
        text: `🚀 ${curPlayer.username} chose ${this.currentColor.toUpperCase()} & slapped ${nextVictim.username} with +4 cards!`,
        type: 'action'
      };
    } else {
      if (!this.lastAction || this.lastAction.type !== 'uno') {
        this.lastAction = {
          text: `${curPlayer.username} played ${card.color.toUpperCase()} ${card.value}.`,
          type: 'play'
        };
      }
    }

    this.advanceTurn(turnSkipSteps);
    return { success: true, gameFinished: false };
  }

  peekNextPlayer(steps = 1) {
    const n = this.players.length;
    const idx = (this.currentTurnIndex + (this.direction * steps) % n + n) % n;
    return this.players[idx];
  }

  drawCard(playerId) {
    if (this.status !== 'playing') throw new Error('Game is not in progress');
    const curPlayer = this.getCurrentPlayer();
    if (curPlayer.id !== playerId) throw new Error("It is not your turn!");

    if (this.unoVulnerablePlayerId && this.unoVulnerablePlayerId !== playerId) {
      this.unoVulnerablePlayerId = null;
    }

    const drawnCards = this.drawCardsForPlayer(curPlayer, 1);
    if (drawnCards.length === 0) throw new Error('No cards left to draw');
    const drawn = drawnCards[0];
    const canPlay = this.canPlayCard(drawn);

    if (!canPlay) {
      this.lastAction = {
        text: `${curPlayer.username} drew a card and passed turn.`,
        type: 'draw'
      };
      this.advanceTurn(1);
      return { card: drawn, playable: false, autoPassed: true };
    }

    this.lastAction = {
      text: `${curPlayer.username} drew a playable card!`,
      type: 'draw'
    };
    return { card: drawn, playable: true, autoPassed: false };
  }

  passTurn(playerId) {
    const curPlayer = this.getCurrentPlayer();
    if (curPlayer.id !== playerId) throw new Error("It is not your turn!");
    this.lastAction = {
      text: `${curPlayer.username} passed turn.`,
      type: 'pass'
    };
    this.advanceTurn(1);
    return { success: true };
  }

  callUno(playerId) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) return false;
    if (player.hand.length <= 2) {
      player.hasCalledUno = true;
      if (this.unoVulnerablePlayerId === player.id) {
        this.unoVulnerablePlayerId = null;
      }
      this.lastAction = {
        text: `🔥 ${player.username} called "UNO!"`,
        type: 'uno'
      };
      return true;
    }
    return false;
  }

  catchUno(challengerId) {
    const challenger = this.players.find((p) => p.id === challengerId);
    if (!challenger) return { success: false, message: 'Invalid player' };
    if (!this.unoVulnerablePlayerId) return { success: false, message: 'No one is vulnerable to an UNO call!' };

    const victim = this.players.find((p) => p.id === this.unoVulnerablePlayerId);
    if (!victim || victim.id === challengerId) return { success: false, message: 'Invalid target' };

    this.drawCardsForPlayer(victim, 2);
    this.unoVulnerablePlayerId = null;
    victim.hasCalledUno = false;

    this.lastAction = {
      text: `🚨 ${challenger.username} CAUGHT ${victim.username} not yelling UNO! ${victim.username} draws 2 penalty cards!`,
      type: 'caught'
    };
    return { success: true, victim: victim.username, challenger: challenger.username };
  }

  makeBotMove() {
    if (this.status !== 'playing') return null;
    const bot = this.getCurrentPlayer();
    if (!bot || !bot.isBot) return null;

    if (this.unoVulnerablePlayerId && this.unoVulnerablePlayerId !== bot.id && Math.random() < 0.7) {
      this.catchUno(bot.id);
      return { type: 'caught_uno' };
    }

    const willCallUno = bot.hand.length <= 2;
    const playableCards = bot.hand.filter((c) => this.canPlayCard(c));

    if (playableCards.length > 0) {
      playableCards.sort((a, b) => {
        if (a.value === 'wild_draw4') return 1;
        if (a.value === 'draw2') return 2;
        if (a.value === 'skip' || a.value === 'reverse') return 3;
        return 4;
      });

      const cardToPlay = playableCards[0];
      let chosenColor = null;

      if (cardToPlay.color === 'wild') {
        const counts = { red: 0, yellow: 0, green: 0, blue: 0 };
        for (const c of bot.hand) {
          if (c.color !== 'wild') counts[c.color]++;
        }
        chosenColor = Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
      }

      return this.playCard(bot.id, cardToPlay.id, chosenColor, willCallUno);
    } else {
      const drawResult = this.drawCard(bot.id);
      if (drawResult.playable && Math.random() < 0.9) {
        let chosenColor = null;
        if (drawResult.card.color === 'wild') {
          chosenColor = COLORS[Math.floor(Math.random() * 4)];
        }
        return this.playCard(bot.id, drawResult.card.id, chosenColor, willCallUno);
      }
      return { type: 'drew_card' };
    }
  }

  getState(forPlayerId = null) {
    const requestingPlayer = this.players.find((p) => p.id === forPlayerId);
    const myTeamId = requestingPlayer?.teamId;

    return {
      roomCode: this.roomCode,
      status: this.status,
      gameMode: this.gameMode,
      teamCount: this.teamCount,
      teamsConfig: TEAMS_CONFIG.slice(0, this.teamCount),
      maxPlayers: this.maxPlayers,
      currentTurnIndex: this.currentTurnIndex,
      currentTurnPlayer: this.getCurrentPlayer() ? {
        id: this.getCurrentPlayer().id,
        username: this.getCurrentPlayer().username,
        avatar: this.getCurrentPlayer().avatar,
        teamId: this.getCurrentPlayer().teamId
      } : null,
      direction: this.direction,
      currentColor: this.currentColor,
      topDiscard: this.getTopDiscard() || null,
      drawPileCount: this.drawPile.length,
      discardPileCount: this.discardPile.length,
      unoVulnerablePlayerId: this.unoVulnerablePlayerId,
      lastAction: this.lastAction,
      winner: this.winner ? {
        id: this.winner.id,
        username: this.winner.username,
        avatar: this.winner.avatar,
        teamId: this.winner.teamId
      } : null,
      winningTeam: this.winningTeam,
      players: this.players.map((p, idx) => {
        const isMe = p.id === forPlayerId;
        const isTeammate = Boolean(this.gameMode === 'team' && myTeamId && p.teamId === myTeamId);
        const canSeeHand = isMe || isTeammate;

        return {
          id: p.id,
          username: p.username,
          avatar: p.avatar,
          cardCount: p.hand.length,
          hasCalledUno: p.hasCalledUno,
          isHost: p.isHost,
          isReady: p.isReady,
          isBot: p.isBot,
          teamId: p.teamId,
          isTeammate: isTeammate && !isMe,
          isCurrentTurn: idx === this.currentTurnIndex,
          hand: canSeeHand ? p.hand : [] // Teammates see each other's cards!
        };
      })
    };
  }
}
