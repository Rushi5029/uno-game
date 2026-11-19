import React, { useState, useRef } from 'react';
import {
  Copy,
  Check,
  Play,
  Bot,
  RotateCw,
  RotateCcw,
  MessageSquare,
  Users,
  LogOut,
  Flame,
  Crown,
  Shuffle,
  Gauge
} from 'lucide-react';
import Card from './Card';
import UserAvatar from './UserAvatar';
import RankBadge from './RankBadge';
import ColorPicker from './ColorPicker';
import UnoControls from './UnoControls';
import TeammateHandTray from './TeammateHandTray';
import { playCardSound, playActionSound } from '../utils/soundEffects';

export default function GameRoom({
  gameState,
  myPlayerId,
  isHost,
  onStartGame,
  onAddBot,
  onRemoveBot,
  onPlayCard,
  onDrawCard,
  onPassTurn,
  onCallUno,
  onCatchUno,
  onLeaveRoom,
  onOpenChat,
  onSetGameMode,
  onSwitchTeam,
  onAutoBalanceTeams,
  unreadCount = 0,
  reactions = []
}) {
  const [copied, setCopied] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState(null);

  // Animation speed: 'medium' (350ms) or 'slow' (650ms)
  const [animSpeed, setAnimSpeed] = useState('medium');

  // Swipe / Drag touch states
  const [dragState, setDragState] = useState({
    cardId: null,
    offsetY: 0,
    isDragging: false
  });
  const touchStartYRef = useRef(0);
  const touchStartXRef = useRef(0);

  // Playing card animating up
  const [animatingCardId, setAnimatingCardId] = useState(null);

  if (!gameState) return null;

  const {
    roomCode,
    status,
    gameMode = 'solo',
    teamCount = 2,
    teamsConfig = [],
    players = [],
    topDiscard,
    currentColor,
    direction,
    drawPileCount,
    lastAction,
    unoVulnerablePlayerId,
    currentTurnPlayer
  } = gameState;

  const me = players.find((p) => p.id === myPlayerId) || {};
  const myHand = me.hand || [];
  const isMyTurn = Boolean(me.isCurrentTurn);

  const teammates = players.filter((p) => p.isTeammate);
  const opponents = players.filter((p) => p.id !== myPlayerId && !p.isTeammate);

  const vulnerablePlayer = players.find((p) => p.id === unoVulnerablePlayerId);
  const canCatchUno = Boolean(vulnerablePlayer && vulnerablePlayer.id !== myPlayerId);

  const canPlayCard = (card) => {
    if (!isMyTurn || status !== 'playing') return false;
    if (card.color === 'wild') return true;
    if (card.color === currentColor) return true;
    if (topDiscard && card.value === topDiscard.value) return true;
    return false;
  };

  const animDuration = animSpeed === 'slow' ? '0.65s' : '0.35s';

  const triggerPlayCard = (card) => {
    if (!canPlayCard(card)) return;

    // Trigger swap up animation
    setAnimatingCardId(card.id);
    playCardSound();

    setTimeout(() => {
      setAnimatingCardId(null);
      if (card.color === 'wild') {
        setPendingWildCard(card);
      } else {
        onPlayCard({
          cardId: card.id,
          chosenColor: null,
          willCallUno: me.hasCalledUno || myHand.length <= 2
        });
      }
    }, animSpeed === 'slow' ? 500 : 250);
  };

  const handleCardClick = (card) => {
    triggerPlayCard(card);
  };

  const handleColorSelected = (chosenColor) => {
    if (!pendingWildCard) return;
    playActionSound();
    onPlayCard({
      cardId: pendingWildCard.id,
      chosenColor,
      willCallUno: me.hasCalledUno || myHand.length <= 2
    });
    setPendingWildCard(null);
  };

  // Mobile Touch Gestures (Swipe Up to Play / Swipe Down to Return)
  const handleTouchStart = (card, e) => {
    if (!isMyTurn) return;
    const touch = e.touches[0];
    touchStartYRef.current = touch.clientY;
    touchStartXRef.current = touch.clientX;
    setDragState({
      cardId: card.id,
      offsetY: 0,
      isDragging: true
    });
  };

  const handleTouchMove = (card, e) => {
    if (!dragState.isDragging || dragState.cardId !== card.id) return;
    const touch = e.touches[0];
    const diffY = touch.clientY - touchStartYRef.current;
    // Allow dragging upward (negative diffY) or slightly downward
    setDragState((prev) => ({
      ...prev,
      offsetY: diffY < 20 ? diffY : 20
    }));
  };

  const handleTouchEnd = (card) => {
    if (!dragState.isDragging || dragState.cardId !== card.id) return;

    // If swiped up past -45px
    if (dragState.offsetY < -45) {
      if (canPlayCard(card)) {
        triggerPlayCard(card);
      }
    }

    // Reset drag with smooth swap-down return
    setDragState({
      cardId: null,
      offsetY: 0,
      isDragging: false
    });
  };

  const copyInviteLink = () => {
    const url = window.location.origin + '?room=' + roomCode;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Curved Fan Math for realistic physical hand
  const calculateCardFan = (index, total) => {
    if (total <= 1) return { rotation: 0, translateY: 0 };
    const maxSpread = Math.min(32, total * 4);
    const step = maxSpread / (total - 1);
    const rotation = -maxSpread / 2 + index * step;
    const normalizedDistance = Math.abs(index - (total - 1) / 2) / (total / 2 || 1);
    const translateY = normalizedDistance * normalizedDistance * 12;
    return { rotation, translateY };
  };

  return (
    <div className="relative w-full min-h-[calc(100dvh-60px)] flex flex-col justify-between p-1.5 sm:p-4 overflow-x-hidden">
      {/* Floating Reactions */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {reactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-28 left-1/2 transform -translate-x-1/2 animate-float-fade text-4xl sm:text-5xl"
            style={{
              left: `${45 + Math.sin(r.id) * 30}%`
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* TOP COMPACT HEADER */}
      <div className="flex items-center justify-between gap-1.5 max-w-6xl mx-auto w-full z-10 px-1">
        {/* Room Code Badge */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-2.5 py-1 shadow-md">
          <div className="text-left">
            <span className="text-[8px] uppercase font-bold text-slate-400 block leading-tight">
              Code
            </span>
            <span className="font-mono font-black text-sm sm:text-base text-yellow-400 tracking-wider">
              {roomCode}
            </span>
          </div>
          <button
            onClick={copyInviteLink}
            className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Copy Invite Link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {gameMode === 'team' && (
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-indigo-600/70 text-indigo-200 border border-indigo-400/50">
              Team
            </span>
          )}
        </div>

        {/* Center: Direction, Active Color & Speed Toggle */}
        {status === 'playing' && (
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-2.5 sm:px-3 py-1 shadow-md">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-200">
              {direction === 1 ? (
                <RotateCw className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5 text-pink-400 animate-spin-slow" />
              )}
            </div>

            <div className="h-3 w-[1px] bg-slate-700"></div>

            {/* Active Color Gem */}
            <div
              className={`w-3.5 h-3.5 rounded-full shadow-lg ${
                currentColor === 'red'
                  ? 'bg-[#D71921] ring-2 ring-red-400'
                  : currentColor === 'yellow'
                  ? 'bg-[#F9A825] ring-2 ring-yellow-200'
                  : currentColor === 'green'
                  ? 'bg-[#2E7D32] ring-2 ring-emerald-400'
                  : 'bg-[#0066CC] ring-2 ring-blue-400'
              }`}
              title={`Active Color: ${currentColor?.toUpperCase()}`}
            ></div>

            <div className="h-3 w-[1px] bg-slate-700"></div>

            {/* Animation Speed Toggle (Medium / Slow) */}
            <button
              onClick={() => setAnimSpeed(animSpeed === 'medium' ? 'slow' : 'medium')}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 transition"
              title="Toggle Card Animation Speed (Medium / Slow)"
            >
              <Gauge className="w-3 h-3 text-yellow-400" />
              <span className="uppercase">{animSpeed === 'medium' ? 'Med' : 'Slow'}</span>
            </button>
          </div>
        )}

        {/* Right side: Chat button & Leave button */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenChat}
            className="relative p-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 text-slate-300 hover:text-white transition shadow-md"
            title="Chat & Reactions"
          >
            <MessageSquare className="w-4 h-4 text-yellow-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white font-black text-[9px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={onLeaveRoom}
            className="p-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-red-500/50 text-slate-400 hover:text-red-400 transition shadow-md"
            title="Leave Table"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* WAITING ROOM LOBBY */}
      {status === 'waiting' && (
        <div className="max-w-2xl mx-auto my-auto w-full bg-slate-900/95 border-2 border-slate-700/80 rounded-3xl p-4 sm:p-8 shadow-2xl backdrop-blur-md text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-yellow-500/30">
            <Users className="w-3.5 h-3.5" />
            <span>
              Players: {players.length} / {gameState.maxPlayers}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
            Game Room Lobby
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mb-4">
            Room Code: <strong className="text-yellow-400 font-mono text-base">{roomCode}</strong>
          </p>

          {/* Mode Selector */}
          <div className="max-w-md mx-auto mb-5 p-1 rounded-2xl bg-slate-950 border border-slate-800 flex items-center">
            <button
              onClick={() => isHost && onSetGameMode('solo', 2)}
              disabled={!isHost}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                gameMode === 'solo'
                  ? 'bg-yellow-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Solo
            </button>
            <button
              onClick={() => isHost && onSetGameMode('team', 2)}
              disabled={!isHost}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                gameMode === 'team'
                  ? 'bg-gradient-to-r from-red-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              👥 Team Play (Shared Cards)
            </button>
          </div>

          {/* Teams Selection */}
          {gameMode === 'team' && (
            <div className="mb-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 px-1 font-bold">
                <span>Select Your Team:</span>
                {isHost && (
                  <button
                    onClick={onAutoBalanceTeams}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Auto-Balance</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {teamsConfig.map((team) => {
                  const teamPlayers = players.filter((p) => p.teamId === team.id);
                  const isMyTeam = me.teamId === team.id;
                  return (
                    <div
                      key={team.id}
                      className={`p-2.5 rounded-2xl border-2 transition text-left ${
                        isMyTeam
                          ? `${team.border} ${team.bg} shadow-md`
                          : 'border-slate-800 bg-slate-950/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-black text-xs uppercase" style={{ color: team.color }}>
                          {team.name}
                        </span>
                        {!isMyTeam && (
                          <button
                            onClick={() => onSwitchTeam(team.id)}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-white"
                          >
                            Join
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        {teamPlayers.length === 0 ? (
                          <span className="text-[10px] text-slate-500 italic">Empty</span>
                        ) : (
                          teamPlayers.map((tp) => (
                            <div key={tp.id} className="flex items-center gap-1.5">
                              <UserAvatar avatarId={tp.avatar} size="sm" showBadge={false} />
                              <span className="text-xs font-semibold text-white truncate max-w-[100px]">
                                {tp.username} {tp.id === myPlayerId && '(You)'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Players Grid (Solo) */}
          {gameMode === 'solo' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
              {players.map((p) => (
                <div
                  key={p.id}
                  className="relative p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center"
                >
                  {p.isHost && (
                    <div className="absolute top-1.5 right-1.5 text-yellow-400" title="Host">
                      <Crown className="w-3.5 h-3.5 fill-yellow-400" />
                    </div>
                  )}
                  <UserAvatar avatarId={p.avatar} rank={p.rank} size="md" />
                  <span className="font-bold text-xs text-white mt-1.5 truncate max-w-full">
                    {p.username}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {p.isBot ? 'AI Bot' : p.isHost ? 'Host' : 'Player'}
                  </span>

                  {isHost && p.isBot && (
                    <button
                      onClick={() => onRemoveBot(p.id)}
                      className="mt-1 text-[10px] text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Host Controls */}
          {isHost ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              {players.length < gameState.maxPlayers && (
                <button
                  onClick={onAddBot}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center gap-1.5"
                >
                  <Bot className="w-4 h-4 text-blue-400" />
                  <span>Add AI Bot</span>
                </button>
              )}

              <button
                onClick={onStartGame}
                disabled={players.length < 2}
                className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 transition active:scale-95 ${
                  players.length >= 2
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-yellow-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Play className="w-4 h-4 stroke-[3]" />
                <span>Start Game ({players.length}/2+ Players)</span>
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-950/40 text-slate-400 text-xs border border-slate-800">
              Waiting for host ({players.find((p) => p.isHost)?.username}) to start...
            </div>
          )}
        </div>
      )}

      {/* ACTIVE PLAYING ARENA */}
      {status === 'playing' && (
        <div className="flex-1 flex flex-col justify-between my-1">
          {/* OPPONENTS STRIP (Responsive: compact horizontal scroll on mobile) */}
          <div className="flex items-center justify-start sm:justify-center overflow-x-auto gap-2.5 sm:gap-5 py-1 px-1 max-w-full">
            {opponents.map((p) => (
              <div
                key={p.id}
                className={`shrink-0 relative flex flex-col items-center p-1.5 sm:p-2 rounded-2xl transition-all ${
                  p.isCurrentTurn
                    ? 'bg-yellow-400/20 border-2 border-yellow-400 shadow-lg shadow-yellow-500/30 scale-105'
                    : 'bg-slate-900/80 border border-slate-800'
                }`}
              >
                {/* UNO Alert Badge */}
                {p.hasCalledUno && (
                  <div className="absolute -top-2.5 bg-[#D71921] text-white font-black text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded-full border border-yellow-300 shadow-md animate-bounce z-20">
                    UNO! 🔥
                  </div>
                )}

                <div className="relative">
                  <UserAvatar avatarId={p.avatar} rank={p.rank} size="sm" />
                  {p.isCurrentTurn && (
                    <div className="absolute -inset-1 rounded-full border-2 border-yellow-400 animate-ping opacity-75 pointer-events-none"></div>
                  )}
                </div>

                <span className="font-bold text-[10px] sm:text-[11px] text-white mt-1 truncate max-w-[65px] sm:max-w-[85px]">
                  {p.username}
                </span>

                {/* Team Tag */}
                {gameMode === 'team' && p.teamId && (
                  <span
                    className="text-[8px] font-black uppercase px-1 rounded mt-0.5"
                    style={{
                      backgroundColor: `${teamsConfig.find((t) => t.id === p.teamId)?.color}33`,
                      color: teamsConfig.find((t) => t.id === p.teamId)?.color
                    }}
                  >
                    {teamsConfig.find((t) => t.id === p.teamId)?.name.split(' ')[1] || 'Team'}
                  </span>
                )}

                {/* Opponent Card Stack */}
                <div className="mt-1">
                  <Card isFacedown isSmall count={p.cardCount} />
                </div>
              </div>
            ))}
          </div>

          {/* PHYSICAL CASINO FELT TABLE */}
          <div className="casino-table max-w-[340px] xs:max-w-md sm:max-w-lg mx-auto w-full my-2 sm:my-3 py-3 sm:py-6 px-3 sm:px-10 rounded-[32px] sm:rounded-[48px] flex flex-col items-center justify-center relative">
            {/* Last Action Notification Banner */}
            {lastAction && (
              <div className="mb-2 px-3 py-1 rounded-full bg-slate-950/85 border border-slate-700 text-[11px] sm:text-xs font-semibold text-slate-200 shadow-md text-center max-w-[280px] sm:max-w-sm truncate">
                {lastAction.text}
              </div>
            )}

            <div className="flex items-center justify-center gap-5 sm:gap-10">
              {/* Draw Pile (Click to draw card) */}
              <div
                onClick={isMyTurn ? onDrawCard : undefined}
                className={`flex flex-col items-center group ${
                  isMyTurn ? 'cursor-pointer active:scale-95' : 'cursor-not-allowed opacity-80'
                }`}
                title={isMyTurn ? 'Tap to Draw 1 Card' : 'Wait for your turn'}
              >
                <div className="transform transition group-hover:-translate-y-1">
                  <Card isFacedown count={drawPileCount} />
                </div>
                <span className="text-[9px] sm:text-[10px] font-black text-slate-300 mt-1 uppercase tracking-wider">
                  Draw Pile
                </span>
              </div>

              {/* Active Discard Pile */}
              <div className="flex flex-col items-center">
                <div className="transform transition">
                  <Card card={topDiscard} />
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-wider">
                    Discard
                  </span>
                  {currentColor && (
                    <span
                      className={`text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full ${
                        currentColor === 'red'
                          ? 'bg-[#D71921] text-white'
                          : currentColor === 'yellow'
                          ? 'bg-[#F9A825] text-slate-950'
                          : currentColor === 'green'
                          ? 'bg-[#2E7D32] text-white'
                          : 'bg-[#0066CC] text-white'
                      }`}
                    >
                      {currentColor}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Turn Prompt */}
            <div className="mt-2 text-center">
              {isMyTurn ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-400 text-slate-950 font-black text-[11px] sm:text-xs uppercase tracking-wider animate-pulse shadow-md">
                  <Flame className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Your Turn • Tap or Swipe Up to Play</span>
                </div>
              ) : (
                <div className="text-[11px] sm:text-xs text-slate-300 font-medium">
                  Waiting for{' '}
                  <strong className="text-yellow-400">
                    {currentTurnPlayer?.username || 'opponent'}
                  </strong>
                  ...
                </div>
              )}
            </div>
          </div>

          {/* TEAM VISION TRAY */}
          {gameMode === 'team' && teammates.length > 0 && (
            <TeammateHandTray
              teammates={teammates}
              currentColor={currentColor}
              topDiscard={topDiscard}
            />
          )}

          {/* UNO ACTION BUTTONS */}
          <UnoControls
            onCallUno={onCallUno}
            onCatchUno={onCatchUno}
            onDrawCard={onDrawCard}
            onPassTurn={onPassTurn}
            canDraw={isMyTurn}
            canPass={false}
            hasCalledUno={me.hasCalledUno}
            cardsLeft={myHand.length}
            canCatchUno={canCatchUno}
            vulnerablePlayerName={vulnerablePlayer?.username}
          />

          {/* MY CURVED HAND OF CARDS */}
          <div className="mt-1 text-center">
            <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-300 mb-1 flex items-center justify-center gap-2">
              <span>Your Hand ({myHand.length} cards)</span>
              {me.hasCalledUno && (
                <span className="text-red-400 font-bold">• UNO Called! 🔥</span>
              )}
              <span className="text-[10px] text-slate-400 font-normal hidden xs:inline">
                (Tap or swipe up to play)
              </span>
            </div>

            {/* Fanned Cards Container */}
            <div className="flex items-end justify-center overflow-x-auto py-4 px-2 max-w-full -space-x-5 xs:-space-x-6 sm:-space-x-8">
              {myHand.map((card, idx) => {
                const playable = canPlayCard(card);
                const { rotation, translateY } = calculateCardFan(idx, myHand.length);

                const isCurrentDrag = dragState.isDragging && dragState.cardId === card.id;
                const isCurrentAnimating = animatingCardId === card.id;

                // Dynamic translateY calculation with gesture & animation:
                // If animating play: slide way up (-120px)
                // If dragging: track finger
                // Else: curved fan translateY
                const effectiveTranslateY = isCurrentAnimating
                  ? -120
                  : isCurrentDrag
                  ? translateY + dragState.offsetY
                  : translateY;

                return (
                  <div
                    key={card.id || idx}
                    className="relative transition-all"
                    style={{
                      zIndex: isCurrentDrag || isCurrentAnimating ? 60 : idx + 10
                    }}
                  >
                    <Card
                      card={card}
                      isPlayable={playable}
                      onClick={() => handleCardClick(card)}
                      onTouchStart={(e) => handleTouchStart(card, e)}
                      onTouchMove={(e) => handleTouchMove(card, e)}
                      onTouchEnd={() => handleTouchEnd(card)}
                      rotation={isCurrentDrag || isCurrentAnimating ? 0 : rotation}
                      translateY={effectiveTranslateY}
                      animDuration={animDuration}
                      isDragging={isCurrentDrag}
                      style={{
                        opacity: isCurrentAnimating ? 0.3 : 1
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Color Picker Modal */}
      {pendingWildCard && (
        <ColorPicker onSelectColor={handleColorSelected} />
      )}
    </div>
  );
}
