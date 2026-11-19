import { UnoGame } from './unoEngine.js';

class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> { game, messages: [], createdAt }
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(options = {}) {
    const code = options.roomCode ? options.roomCode.toUpperCase() : this.generateRoomCode();
    const game = new UnoGame(code, {
      maxPlayers: options.maxPlayers || 10
    });
    this.rooms.set(code, {
      game,
      messages: [],
      createdAt: Date.now()
    });
    return game;
  }

  getRoom(roomCode) {
    if (!roomCode) return null;
    return this.rooms.get(roomCode.toUpperCase()) || null;
  }

  getGame(roomCode) {
    const room = this.getRoom(roomCode);
    return room ? room.game : null;
  }

  deleteRoom(roomCode) {
    return this.rooms.delete(roomCode.toUpperCase());
  }

  addMessage(roomCode, message) {
    const room = this.getRoom(roomCode);
    if (!room) return null;
    const msg = {
      id: Date.now() + Math.random().toString(36).substring(2, 6),
      sender: message.sender,
      avatar: message.avatar,
      text: message.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: Boolean(message.isSystem)
    };
    room.messages.push(msg);
    if (room.messages.length > 50) {
      room.messages.shift();
    }
    return msg;
  }

  getMessages(roomCode) {
    const room = this.getRoom(roomCode);
    return room ? room.messages : [];
  }

  getPublicRooms() {
    const list = [];
    for (const [code, room] of this.rooms.entries()) {
      if (room.game.status === 'waiting') {
        list.push({
          roomCode: code,
          playerCount: room.game.players.length,
          maxPlayers: room.game.maxPlayers,
          host: room.game.players[0]?.username || 'Anonymous',
          status: room.game.status
        });
      }
    }
    return list;
  }
}

export const roomManager = new RoomManager();
