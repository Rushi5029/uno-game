import React, { useState } from 'react';
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
  Shield,
  Shuffle
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

  // Teammates and Opponents
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

  const handleCardClick = (card) => {
    if (!canPlayCard(card)) return;
    playCardSound();

    if (card.color === 'wild') {
      setPendingWildCard(card);
    } else {
      onPlayCard({
        cardId: card.id,
        chosenColor: null,
        willCallUno: me.hasCalledUno || myHand.length <= 2
      });
    }
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

  const copyInviteLink = () => {
    const url = window.location.origin + '?room=' + roomCode;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Curved Fan Math for realistic human hand
  const calculateCardFan = (index, total) => {
    if (total <= 1) return { rotation: 0, translateY: 0 };
    const maxSpread = Math.min(36, total * 4.5);
    const step = maxSpread / (total - 1);
    const rotation = -maxSpread / 2 + index * step;
    const normalizedDistance = Math.abs(index - (total - 1) / 2) / (total / 2 || 1);
    const translateY = normalizedDistance * normalizedDistance * 14;
    return { rotation, translateY };
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-65px)] flex flex-col justify-between p-2 sm:p-4 overflow-hidden">
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

      {/* TOP HEADER / GAME CONTROLS */}
      <div className="flex items-center justify-between gap-2 max-w-6xl mx-auto w-full z-10">
        {/* Room Code & Mode Badge */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-3 py-1.5 shadow-md">
          <div className="text-left">
            <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">
              Room Code
            </span>
            <span className="font-mono font-black text-base text-yellow-400 tracking-wider">
              {roomCode}
            </span>
          </div>
          <button
            onClick={copyInviteLink}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Copy Invite Link"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {gameMode === 'team' && (
            <span className="ml-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-600/60 text-indigo-200 border border-indigo-400/50">
              Team Play
            </span>
          )}
        </div>

        {/* Center: Turn Direction & Active Color Gem */}
        {status === 'playing' && (
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-1.5 shadow-md">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              {direction === 1 ? (
                <>
                  <RotateCw className="w-4 h-4 text-emerald-400 animate-spin-slow" />
                  <span className="hidden sm:inline">Clockwise</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 text-pink-400 animate-spin-slow" />
                  <span className="hidden sm:inline">Counter-Clockwise</span>
                </>
              )}
            </div>

            <div className="h-4 w-[1px] bg-slate-700"></div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase font-black hidden sm:inline">
                Color
              </span>
              <div
                className={`w-4 h-4 rounded-full shadow-lg ${
                  currentColor === 'red'
                    ? 'bg-red-600 ring-2 ring-red-400 shadow-red-500/50'
                    : currentColor === 'yellow'
                    ? 'bg-yellow-400 ring-2 ring-yellow-200 shadow-yellow-400/50'
                    : currentColor === 'green'
                    ? 'bg-emerald-600 ring-2 ring-emerald-400 shadow-emerald-500/50'
                    : 'bg-blue-600 ring-2 ring-blue-400 shadow-blue-500/50'
                }`}
              ></div>
            </div>
          </div>
        )}

        {/* Right side: Chat button & Leave button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenChat}
            className="relative p-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 text-slate-300 hover:text-white transition shadow-md"
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
            className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-red-500/50 text-slate-400 hover:text-red-400 transition shadow-md"
            title="Leave Table"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* WAITING ROOM LOBBY (Team selection & options) */}
      {status === 'waiting' && (
        <div className="max-w-3xl mx-auto my-auto w-full bg-slate-900/95 border-2 border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-center">
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-yellow-500/30">
            <Users className="w-3.5 h-3.5" />
            <span>
              Players Joined: {players.length} / {gameState.maxPlayers}
            </span>
          </div>

          <h2 className="text-3xl font-black text-white mb-1">
            Game Room Lobby
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mb-6">
            Share code <strong className="text-yellow-400 font-mono">{roomCode}</strong> with friends (supports 2 to 10 players)
          </p>

          {/* GAME MODE SELECTOR (Solo vs Team Play) */}
          <div className="max-w-md mx-auto mb-6 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center">
            <button
              onClick={() => isHost && onSetGameMode('solo', 2)}
              disabled={!isHost}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                gameMode === 'solo'
                  ? 'bg-yellow-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Solo (Free for All)
            </button>
            <button
              onClick={() => isHost && onSetGameMode('team', players.length >= 6 ? 2 : 2)}
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

          {/* TEAM SELECTION BOXES (When in Team Play Mode) */}
          {gameMode === 'team' && (
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 px-2 font-bold">
                <span>Choose your Team:</span>
                {isHost && (
                  <button
                    onClick={onAutoBalanceTeams}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Auto-Balance Teams</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {teamsConfig.map((team) => {
                  const teamPlayers = players.filter((p) => p.teamId === team.id);
                  const isMyTeam = me.teamId === team.id;
                  return (
                    <div
                      key={team.id}
                      className={`p-3 rounded-2xl border-2 transition text-left ${
                        isMyTeam
                          ? `${team.border} ${team.bg} shadow-lg`
                          : 'border-slate-800 bg-slate-950/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-xs uppercase" style={{ color: team.color }}>
                          {team.name}
                        </span>
                        {!isMyTeam && (
                          <button
                            onClick={() => onSwitchTeam(team.id)}
                            className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-white"
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
                            <div key={tp.id} className="flex items-center gap-2">
                              <UserAvatar avatarId={tp.avatar} size="sm" showBadge={false} />
                              <span className="text-xs font-semibold text-white truncate max-w-[120px]">
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

          {/* Solo Players Grid */}
          {gameMode === 'solo' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {players.map((p) => (
                <div
                  key={p.id}
                  className="relative p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center"
                >
                  {p.isHost && (
                    <div className="absolute top-2 right-2 text-yellow-400" title="Host">
                      <Crown className="w-3.5 h-3.5 fill-yellow-400" />
                    </div>
                  )}
                  <UserAvatar avatarId={p.avatar} rank={p.rank} size="md" />
                  <span className="font-bold text-xs text-white mt-2 truncate max-w-full">
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {players.length < gameState.maxPlayers && (
                <button
                  onClick={onAddBot}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center gap-2"
                >
                  <Bot className="w-4 h-4 text-blue-400" />
                  <span>Add AI Bot</span>
                </button>
              )}

              <button
                onClick={onStartGame}
                disabled={players.length < 2}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 transition transform active:scale-95 ${
                  players.length >= 2
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 shadow-yellow-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Play className="w-4 h-4 stroke-[3]" />
                <span>Start Game ({players.length}/2+ Players)</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950/40 text-slate-400 text-xs border border-slate-800">
              Waiting for the host ({players.find((p) => p.isHost)?.username}) to start the match...
            </div>
          )}
        </div>
      )}

      {/* ACTIVE PLAYING ARENA */}
      {status === 'playing' && (
        <div className="flex-1 flex flex-col justify-between my-1">
          {/* OPPONENTS SEATING RING */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 py-2">
            {opponents.map((p) => (
              <div
                key={p.id}
                className={`relative flex flex-col items-center p-2 rounded-2xl transition-all ${
                  p.isCurrentTurn
                    ? 'bg-yellow-400/15 border-2 border-yellow-400 shadow-xl shadow-yellow-500/30 scale-105'
                    : 'bg-slate-900/70 border border-slate-800'
                }`}
              >
                {/* UNO Alert Badge */}
                {p.hasCalledUno && (
                  <div className="absolute -top-3 bg-red-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full border border-yellow-300 shadow-md animate-bounce z-20">
                    UNO! 🔥
                  </div>
                )}

                <div className="relative">
                  <UserAvatar avatarId={p.avatar} rank={p.rank} size="sm" />
                  {p.isCurrentTurn && (
                    <div className="absolute -inset-1 rounded-full border-2 border-yellow-400 animate-ping opacity-70 pointer-events-none"></div>
                  )}
                </div>

                <span className="font-bold text-[11px] text-white mt-1 truncate max-w-[85px]">
                  {p.username}
                </span>

                {/* Team Tag */}
                {gameMode === 'team' && p.teamId && (
                  <span
                    className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full mt-0.5"
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

          {/* CASINO FELT TABLE (Authentic physical look) */}
          <div className="casino-table max-w-lg mx-auto w-full my-3 py-6 px-6 sm:px-10 rounded-[48px] flex flex-col items-center justify-center relative">
            {/* Last Action Notification Banner */}
            {lastAction && (
              <div className="mb-3 px-4 py-1.5 rounded-full bg-slate-950/85 border border-slate-700 text-xs font-semibold text-slate-200 shadow-lg text-center max-w-sm">
                {lastAction.text}
              </div>
            )}

            <div className="flex items-center justify-center gap-8 sm:gap-12">
              {/* Draw Pile (Stacked realistic cards) */}
              <div
                onClick={isMyTurn ? onDrawCard : undefined}
                className={`flex flex-col items-center group ${
                  isMyTurn ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'
                }`}
                title={isMyTurn ? 'Click to Draw 1 Card' : 'Wait for your turn'}
              >
                <div className="transform transition group-hover:-translate-y-2">
                  <Card isFacedown count={drawPileCount} />
                </div>
                <span className="text-[10px] font-bold text-slate-300 mt-2 uppercase tracking-wider">
                  Draw Pile
                </span>
              </div>

              {/* Active Discard Pile */}
              <div className="flex flex-col items-center">
                <div className="transform transition">
                  <Card card={topDiscard} />
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                    Discard Pile
                  </span>
                  {currentColor && (
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        currentColor === 'red'
                          ? 'bg-red-600 text-white'
                          : currentColor === 'yellow'
                          ? 'bg-yellow-400 text-slate-950'
                          : currentColor === 'green'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {currentColor}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Turn Prompt */}
            <div className="mt-4 text-center">
              {isMyTurn ? (
                <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider animate-pulse shadow-lg shadow-yellow-500/30">
                  <Flame className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Your Turn - Play a matching card or draw</span>
                </div>
              ) : (
                <div className="text-xs text-slate-300 font-medium">
                  Waiting for{' '}
                  <strong className="text-yellow-400">
                    {currentTurnPlayer?.username || 'next player'}
                  </strong>
                  ...
                </div>
              )}
            </div>
          </div>

          {/* TEAM VISION TRAY (If in Team Play) */}
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
            <div className="text-xs font-black uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-center gap-2">
              <span>Your Hand ({myHand.length} cards)</span>
              {me.hasCalledUno && (
                <span className="text-red-400 font-bold">• UNO Called! 🔥</span>
              )}
            </div>

            {/* Realistic Curved Arc Layout */}
            <div className="flex items-center justify-center overflow-x-auto py-5 px-4 max-w-full -space-x-5 sm:-space-x-7">
              {myHand.map((card, idx) => {
                const playable = canPlayCard(card);
                const { rotation, translateY } = calculateCardFan(idx, myHand.length);
                return (
                  <div
                    key={card.id || idx}
                    className="relative transition-all"
                    style={{
                      zIndex: idx + 10
                    }}
                  >
                    <Card
                      card={card}
                      isPlayable={playable}
                      onClick={() => handleCardClick(card)}
                      rotation={rotation}
                      translateY={translateY}
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
