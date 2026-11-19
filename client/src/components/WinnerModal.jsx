import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Crown } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { playWinSound } from '../utils/soundEffects';

export default function WinnerModal({
  winner,
  players = [],
  isHost,
  onPlayAgain,
  onLeaveRoom
}) {
  useEffect(() => {
    playWinSound();
    // Fire festive confetti cannon
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#dc2626', '#eab308', '#16a34a', '#2563eb']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#dc2626', '#eab308', '#16a34a', '#2563eb']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border-2 border-yellow-500/50 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/30 rounded-full blur-3xl pointer-events-none"></div>

        <div className="mb-4 inline-flex p-3 rounded-full bg-yellow-500/20 border-2 border-yellow-400 text-yellow-400">
          <Crown className="w-10 h-10 fill-yellow-400 text-yellow-400 animate-bounce" />
        </div>

        <h2 className="text-3xl font-black text-white tracking-wide">
          VICTORY!
        </h2>
        <p className="text-yellow-400 font-bold text-sm mb-6">
          {winner?.username} played all their cards!
        </p>

        {/* Winner Showcase */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-yellow-500/30 flex items-center justify-center gap-4 mb-6">
          <UserAvatar avatarId={winner?.avatar} size="lg" rank={1} />
          <div className="text-left">
            <div className="text-xl font-black text-white">{winner?.username}</div>
            <div className="text-xs text-emerald-400 font-semibold">1st Place Winner 👑</div>
          </div>
        </div>

        {/* Other players summary */}
        <div className="space-y-2 mb-6 text-left">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
            Final Standings
          </span>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {players.map((p, idx) => (
              <div
                key={p.username}
                className="px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400">#{idx + 1}</span>
                  <UserAvatar avatarId={p.avatar} size="sm" showBadge={false} />
                  <span className="font-semibold text-white">{p.username}</span>
                </div>
                <span className="text-slate-400 font-medium">
                  {p.cardCount === 0 ? '🏆 Winner' : `${p.cardCount} cards left`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onLeaveRoom}
            className="flex-1 py-3 rounded-2xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center gap-2 text-sm"
          >
            <Home className="w-4 h-4" />
            <span>Lobby</span>
          </button>

          {isHost ? (
            <button
              onClick={onPlayAgain}
              className="flex-1 py-3 rounded-2xl font-black text-slate-950 bg-yellow-400 hover:bg-yellow-300 shadow-lg shadow-yellow-500/20 active:scale-95 transition flex items-center justify-center gap-2 text-sm"
            >
              <RotateCcw className="w-4 h-4 stroke-[3]" />
              <span>Play Again</span>
            </button>
          ) : (
            <div className="flex-1 text-xs text-slate-400 italic flex items-center justify-center">
              Waiting for host to restart...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
