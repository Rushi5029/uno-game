import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Navbar from './components/Navbar';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import LoginModal from './components/LoginModal';
import ProfileModal from './components/ProfileModal';
import Leaderboard from './components/Leaderboard';
import RulesModal from './components/RulesModal';
import WinnerModal from './components/WinnerModal';
import ChatDrawer from './components/ChatDrawer';
import { toggleSound, isSoundEnabled, playActionSound } from './utils/soundEffects';

let socket = null;

export default function App() {
  const [user, setUser] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [currentRoomCode, setCurrentRoomCode] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winnerData, setWinnerData] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [unreadChat, setUnreadChat] = useState(0);
  const [reactions, setReactions] = useState([]);
  const [soundOn, setSoundOn] = useState(true);

  // 1. Restore User from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('uno_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        fetch(`/api/auth/profile/${encodeURIComponent(parsed.username)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.user) {
              setUser(data.user);
              localStorage.setItem('uno_user', JSON.stringify(data.user));
            }
          })
          .catch(() => {});
      } catch (e) {}
    }
  }, []);

  // 2. Initialize Socket Connection
  useEffect(() => {
    const serverUrl = window.location.origin;
    socket = io(serverUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Connected to UNO Game Socket server:', socket.id);
    });

    socket.on('error-msg', (msg) => {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    });

    socket.on('joined-successfully', ({ roomCode, player, isHost: hostStatus }) => {
      setCurrentRoomCode(roomCode);
      setIsHost(hostStatus);
    });

    socket.on('game-state', (state) => {
      setGameState(state);
    });

    socket.on('room-info', ({ roomCode, messages }) => {
      if (messages) {
        setChatMessages(messages);
      }
    });

    socket.on('chat-message', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
      if (!showChat) {
        setUnreadChat((prev) => prev + 1);
      }
    });

    socket.on('player-reaction', (reaction) => {
      setReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 2500);
    });

    socket.on('game-over', (data) => {
      setWinnerData(data);
      setShowWinnerModal(true);
      if (user) {
        fetch(`/api/auth/profile/${encodeURIComponent(user.username)}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.user) {
              setUser(d.user);
              localStorage.setItem('uno_user', JSON.stringify(d.user));
            }
          })
          .catch(() => {});
      }
    });

    socket.on('game-restarted', () => {
      setShowWinnerModal(false);
      setWinnerData(null);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // 3. Handle Auto-join from URL parameter (e.g. ?room=ABCD)
  useEffect(() => {
    if (user && socket && socket.connected && !currentRoomCode) {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        handleJoinRoom(roomParam.toUpperCase());
      }
    }
  }, [user, socket]);

  // Auth Handlers
  const handleLogin = (loggedUser) => {
    setUser(loggedUser);
    localStorage.setItem('uno_user', JSON.stringify(loggedUser));
  };

  const handleUpdateProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('uno_user', JSON.stringify(updatedUser));
  };

  // Sound Handler
  const handleToggleSound = () => {
    const newState = toggleSound();
    setSoundOn(newState);
  };

  // Room Handlers
  const handleCreateRoom = (options = {}) => {
    if (!user || !socket) return;
    socket.emit('join-room', {
      username: user.username,
      avatar: user.avatar,
      roomCode: null,
      gameMode: options.gameMode || 'solo',
      teamCount: options.teamCount || 2
    });
  };

  const handleJoinRoom = (code) => {
    if (!user || !socket) return;
    socket.emit('join-room', {
      username: user.username,
      avatar: user.avatar,
      roomCode: code
    });
  };

  const handleLeaveRoom = () => {
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
    setGameState(null);
    setCurrentRoomCode(null);
    setShowWinnerModal(false);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  // Mode and Team Handlers
  const handleSetGameMode = (mode, teamCount = 2) => {
    if (socket) socket.emit('set-game-mode', { mode, teamCount });
  };

  const handleSwitchTeam = (teamId) => {
    if (socket) socket.emit('switch-team', { teamId });
  };

  const handleAutoBalanceTeams = () => {
    if (socket) socket.emit('auto-balance-teams');
  };

  // Game Action Handlers
  const handleStartGame = () => {
    if (socket) socket.emit('start-game');
  };

  const handleAddBot = () => {
    if (socket) socket.emit('add-bot');
  };

  const handleRemoveBot = (botId) => {
    if (socket) socket.emit('remove-bot', { botId });
  };

  const handlePlayCard = (payload) => {
    if (socket) socket.emit('play-card', payload);
  };

  const handleDrawCard = () => {
    if (socket) socket.emit('draw-card');
  };

  const handlePassTurn = () => {
    if (socket) socket.emit('pass-turn');
  };

  const handleCallUno = () => {
    if (socket) socket.emit('call-uno');
  };

  const handleCatchUno = () => {
    if (socket) socket.emit('catch-uno');
  };

  const handleSendMessage = (text) => {
    if (socket) socket.emit('send-message', { text });
  };

  const handleSendReaction = (emoji) => {
    if (socket) socket.emit('send-reaction', { emoji });
  };

  const handlePlayAgain = () => {
    if (socket) socket.emit('restart-game');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col font-sans select-none text-slate-100">
      {/* Top Navigation */}
      <Navbar
        user={user}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenRules={() => setShowRules(true)}
        soundOn={soundOn}
        onToggleSound={handleToggleSound}
      />

      {/* Global Error Notification */}
      {errorMsg && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 px-6 py-2.5 rounded-2xl bg-red-600/90 text-white font-bold text-xs shadow-xl border border-red-400 animate-bounce">
          {errorMsg}
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        {!user ? (
          <LoginModal onLogin={handleLogin} />
        ) : !currentRoomCode || !gameState ? (
          <Lobby
            user={user}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
          />
        ) : (
          <GameRoom
            gameState={gameState}
            myPlayerId={socket?.id}
            isHost={isHost}
            onStartGame={handleStartGame}
            onAddBot={handleAddBot}
            onRemoveBot={handleRemoveBot}
            onPlayCard={handlePlayCard}
            onDrawCard={handleDrawCard}
            onPassTurn={handlePassTurn}
            onCallUno={handleCallUno}
            onCatchUno={handleCatchUno}
            onLeaveRoom={handleLeaveRoom}
            onSetGameMode={handleSetGameMode}
            onSwitchTeam={handleSwitchTeam}
            onAutoBalanceTeams={handleAutoBalanceTeams}
            onOpenChat={() => {
              setShowChat(true);
              setUnreadChat(0);
            }}
            unreadCount={unreadChat}
            reactions={reactions}
          />
        )}
      </main>

      {/* Chat Drawer */}
      <ChatDrawer
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        onSendReaction={handleSendReaction}
      />

      {/* User Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onUpdateProfile={handleUpdateProfile}
      />

      {/* Leaderboard Modal */}
      <Leaderboard
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      {/* Rules Modal */}
      <RulesModal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
      />

      {/* Winner Celebration Modal */}
      {showWinnerModal && (
        <WinnerModal
          winner={winnerData?.winner}
          winningTeam={winnerData?.winningTeam}
          gameMode={winnerData?.gameMode}
          players={winnerData?.players}
          isHost={isHost}
          onPlayAgain={handlePlayAgain}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </div>
  );
}
