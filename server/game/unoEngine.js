import { createDeck, shuffleDeck, COLORS } from './deck.js';

export class UnoGame {
  constructor(roomCode, options = {}) {
    this.roomCode = roomCode;
    this.maxPlayers = options.maxPlayers || 10;
    this.players = []; // { id, username, avatar, hand: [], hasCalledUno: false, rank: null, isBot: false }
    this.drawPile = [];
    this.discardPile = [];
    this.currentTurnIndex = 0;
    this.direction = 1; // 1 = clockwise, -1 = counter-clockwise
    this.currentColor = null;
    this.status = 'waiting'; // 'waiting', 'playing', 'finished'
    this.winner = null;
    this.turnTimeLimit = options.turnTimeLimit || 30; // seconds
    this.turnTimer = null;
    this.unoVulnerablePlayerId = null; // Player who has 1 card but forgot to call UNO
    this.lastAction = null; // { text, type, player }
    this.turnCount = 0;
    this.drawnCardThisTurn = null; // If current player drew a card, stores the card if playable
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
      // Reconnection or update socket id
      this.players[existingIndex].id = player.id;
      return this.players[existingIndex];
    }

    const newPlayer = {
      id: player.id,
      username: player.username,
      avatar: player.avatar || 'avatar-1',
      hand: [],
      hasCalledUno: false,
      isHost: this.players.length === 0,
      isReady: false,
      isBot: Boolean(player.isBot),
      score: 0
    };
    this.players.push(newPlayer);
    return newPlayer;
  }

  removePlayer(playerId) {
    const index = this.players.findIndex((p) => p.id === playerId);
    if (index === -1) return null;
    const removed = this.players.splice(index, 1)[0];

    // If host left, assign next player as host
    if (removed.isHost && this.players.length > 0) {
      this.players[0].isHost = true;
    }

    // If game in progress, handle turn index
    if (this.status === 'playing') {
      if (this.players.length < 2) {
        // Less than 2 players, abort game
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
    const botNames = ['RoboUno', 'PixelBot', 'CyberAce', 'ByteMaster', 'MegaBot', 'TurboDeck'];
    const botName = botNames[botNum - 1] || `Bot_${botNum}`;
    const botAvatars = ['avatar-2', 'avatar-3', 'avatar-4', 'avatar-5', 'avatar-6'];
    const bot = {
      id: `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: botName,
      avatar: botAvatars[(botNum - 1) % botAvatars.length],
      hand: [],
      hasCalledUno: false,
      isHost: false,
      isReady: true,
      isBot: true,
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

    // 1. Prepare and shuffle deck
    this.drawPile = shuffleDeck(createDeck());
    this.discardPile = [];
    this.status = 'playing';
    this.winner = null;
    this.direction = 1;
    this.currentTurnIndex = Math.floor(Math.random() * this.players.length);
    this.turnCount = 0;
    this.unoVulnerablePlayerId = null;
    this.drawnCardThisTurn = null;

    // 2. Deal 7 cards to each player
    for (const player of this.players) {
      player.hand = this.drawPile.splice(0, 7);
      player.hasCalledUno = false;
    }

    // 3. Flip starting card (must not be Wild Draw 4 for clean start)
    let firstCard = this.drawPile.pop();
    while (firstCard.value === 'wild_draw4') {
      this.drawPile.unshift(firstCard);
      firstCard = this.drawPile.pop();
    }
    this.discardPile.push(firstCard);
    this.currentColor = firstCard.color === 'wild' ? COLORS[Math.floor(Math.random() * 4)] : firstCard.color;

    // Handle initial action card if flipped
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

  canPlayCard(card, playerHand = null) {
    const top = this.getTopDiscard();
    if (!top) return true;

    // Wild cards can always be played
    if (card.color === 'wild') {
      return true;
    }

    // Color match (matches current active color)
    if (card.color === this.currentColor) {
      return true;
    }

    // Number or Symbol match
    if (card.value === top.value) {
      return true;
    }

    return false;
  }

  hasAnyPlayableCard(hand) {
    return hand.some((card) => this.canPlayCard(card, hand));
  }

  advanceTurn(steps = 1) {
    const n = this.players.length;
    this.currentTurnIndex = (this.currentTurnIndex + (this.direction * steps) % n + n) % n;
    this.turnCount++;
    this.drawnCardThisTurn = null;
  }

  /**
   * Play card action
   */
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

    if (!this.canPlayCard(card, curPlayer.hand)) {
      throw new Error('This card cannot be played on the current discard card.');
    }

    // If wild card, chosenColor must be valid
    if (card.color === 'wild') {
      if (!chosenColor || !COLORS.includes(chosenColor)) {
        throw new Error('Please choose a valid color (red, yellow, green, or blue).');
      }
    }

    // Remove card from hand
    curPlayer.hand.splice(cardIndex, 1);
    this.discardPile.push(card);

    // Update active color
    if (card.color === 'wild') {
      this.currentColor = chosenColor;
    } else {
      this.currentColor = card.color;
    }

    // UNO! handling:
    // If player has exactly 1 card remaining:
    if (curPlayer.hand.length === 1) {
      if (willCallUno || curPlayer.hasCalledUno) {
        curPlayer.hasCalledUno = true;
        this.unoVulnerablePlayerId = null;
        this.lastAction = {
          text: `🔥 ${curPlayer.username} yelled "UNO!" with 1 card left!`,
          type: 'uno'
        };
      } else {
        // Did not yell UNO! Vulnerable to challenge!
        this.unoVulnerablePlayerId = curPlayer.id;
        this.lastAction = {
          text: `⚠️ ${curPlayer.username} played a card and has 1 card left (didn't say UNO)!`,
          type: 'warning'
        };
      }
    } else {
      curPlayer.hasCalledUno = false;
      this.unoVulnerablePlayerId = null;
    }

    // Check for round win!
    if (curPlayer.hand.length === 0) {
      this.status = 'finished';
      this.winner = curPlayer;
      this.lastAction = {
        text: `🏆 ${curPlayer.username} WON THE GAME!`,
        type: 'win'
      };
      return { success: true, gameFinished: true, winner: curPlayer };
    }

    // Action Card Effects
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
        // 2 players: reverse acts like skip
        turnSkipSteps = 2;
        this.lastAction = {
          text: `🔄 ${curPlayer.username} reversed! In 2-player game, opponent is skipped.`,
          type: 'action'
        };
      } else {
        this.direction *= -1;
        this.lastAction = {
          text: `🔄 Direction reversed by ${curPlayer.username}!`,
          type: 'action'
        };
      }
    } else if (card.value === 'draw2') {
      const nextVictim = this.peekNextPlayer(1);
      this.drawCardsForPlayer(nextVictim, 2);
      turnSkipSteps = 2; // Next player loses turn
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
      turnSkipSteps = 2; // Next player loses turn
      this.lastAction = {
        text: `🚀 ${curPlayer.username} changed color to ${this.currentColor.toUpperCase()} and hit ${nextVictim.username} with +4 cards!`,
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

  /**
   * Draw card action: Player draws 1 card
   */
  drawCard(playerId) {
    if (this.status !== 'playing') {
      throw new Error('Game is not in progress');
    }
    const curPlayer = this.getCurrentPlayer();
    if (curPlayer.id !== playerId) {
      throw new Error("It is not your turn!");
    }

    // Vulnerability expires once next action starts
    if (this.unoVulnerablePlayerId && this.unoVulnerablePlayerId !== playerId) {
      this.unoVulnerablePlayerId = null;
    }

    const drawnCards = this.drawCardsForPlayer(curPlayer, 1);
    if (drawnCards.length === 0) {
      throw new Error('No cards left to draw');
    }
    const drawn = drawnCards[0];

    const canPlay = this.canPlayCard(drawn, curPlayer.hand);
    this.drawnCardThisTurn = canPlay ? drawn : null;

    if (!canPlay) {
      // Cannot play, turn automatically ends
      this.lastAction = {
        text: `${curPlayer.username} drew a card and passed turn.`,
        type: 'draw'
      };
      this.advanceTurn(1);
      return { card: drawn, playable: false, autoPassed: true };
    }

    this.lastAction = {
      text: `${curPlayer.username} drew a card (playable!).`,
      type: 'draw'
    };
    return { card: drawn, playable: true, autoPassed: false };
  }

  /**
   * Pass turn after drawing a playable card if player decides not to play it
   */
  passTurn(playerId) {
    const curPlayer = this.getCurrentPlayer();
    if (curPlayer.id !== playerId) {
      throw new Error("It is not your turn!");
    }
    this.lastAction = {
      text: `${curPlayer.username} passed turn.`,
      type: 'pass'
    };
    this.advanceTurn(1);
    return { success: true };
  }

  /**
   * Call UNO action
   */
  callUno(playerId) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) return false;

    // If player has 1 or 2 cards, they can press UNO!
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

  /**
   * Challenge / Catch UNO: Another player catches someone who has 1 card without saying UNO!
   */
  catchUno(challengerId) {
    const challenger = this.players.find((p) => p.id === challengerId);
    if (!challenger) return { success: false, message: 'Invalid player' };

    if (!this.unoVulnerablePlayerId) {
      return { success: false, message: 'No one forgot to call UNO!' };
    }

    const victim = this.players.find((p) => p.id === this.unoVulnerablePlayerId);
    if (!victim || victim.id === challengerId) {
      return { success: false, message: 'Invalid target' };
    }

    // Penalize victim with 2 cards!
    this.drawCardsForPlayer(victim, 2);
    this.unoVulnerablePlayerId = null;
    victim.hasCalledUno = false;

    this.lastAction = {
      text: `🚨 ${challenger.username} CAUGHT ${victim.username} not saying UNO! ${victim.username} draws 2 penalty cards!`,
      type: 'caught'
    };
    return { success: true, victim: victim.username, challenger: challenger.username };
  }

  /**
   * Bot AI decision maker
   */
  makeBotMove() {
    if (this.status !== 'playing') return null;
    const bot = this.getCurrentPlayer();
    if (!bot || !bot.isBot) return null;

    // Check if bot can catch someone who forgot UNO
    if (this.unoVulnerablePlayerId && this.unoVulnerablePlayerId !== bot.id && Math.random() < 0.6) {
      this.catchUno(bot.id);
      return { type: 'caught_uno' };
    }

    // Bot decides whether to yell UNO if has 2 cards
    const willCallUno = bot.hand.length <= 2;

    // Find playable cards
    const playableCards = bot.hand.filter((c) => this.canPlayCard(c, bot.hand));

    if (playableCards.length > 0) {
      // Prioritize: Action cards (+4, +2, skip, reverse) or high matching numbers
      playableCards.sort((a, b) => {
        if (a.value === 'wild_draw4') return 1;
        if (a.value === 'draw2') return 2;
        if (a.value === 'skip' || a.value === 'reverse') return 3;
        return 4;
      });

      const cardToPlay = playableCards[0];
      let chosenColor = null;

      if (cardToPlay.color === 'wild') {
        // Pick the color bot has most of
        const counts = { red: 0, yellow: 0, green: 0, blue: 0 };
        for (const c of bot.hand) {
          if (c.color !== 'wild') counts[c.color]++;
        }
        chosenColor = Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
      }

      return this.playCard(bot.id, cardToPlay.id, chosenColor, willCallUno);
    } else {
      // Draw card
      const drawResult = this.drawCard(bot.id);
      if (drawResult.playable && Math.random() < 0.9) {
        // Play drawn card immediately
        let chosenColor = null;
        if (drawResult.card.color === 'wild') {
          chosenColor = COLORS[Math.floor(Math.random() * 4)];
        }
        return this.playCard(bot.id, drawResult.card.id, chosenColor, willCallUno);
      }
      return { type: 'drew_card' };
    }
  }

  /**
   * Safe public game state for clients
   */
  getState(forPlayerId = null) {
    return {
      roomCode: this.roomCode,
      status: this.status,
      maxPlayers: this.maxPlayers,
      currentTurnIndex: this.currentTurnIndex,
      currentTurnPlayer: this.getCurrentPlayer() ? {
        id: this.getCurrentPlayer().id,
        username: this.getCurrentPlayer().username,
        avatar: this.getCurrentPlayer().avatar
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
        avatar: this.winner.avatar
      } : null,
      players: this.players.map((p, idx) => ({
        id: p.id,
        username: p.username,
        avatar: p.avatar,
        cardCount: p.hand.length,
        hasCalledUno: p.hasCalledUno,
        isHost: p.isHost,
        isReady: p.isReady,
        isBot: p.isBot,
        isCurrentTurn: idx === this.currentTurnIndex,
        hand: forPlayerId && p.id === forPlayerId ? p.hand : [] // Only reveal hand to owner
      }))
    };
  }
}
