import React from 'react';
import { Flame, ShieldAlert, Layers, CheckCircle } from 'lucide-react';
import { playUnoSound, playDrawSound } from '../utils/soundEffects';

export default function UnoControls({
  onCallUno,
  onCatchUno,
  onDrawCard,
  onPassTurn,
  canDraw,
  canPass,
  hasCalledUno,
  cardsLeft,
  canCatchUno,
  vulnerablePlayerName
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-2">
      {/* UNO! Yell Button */}
      <button
        onClick={() => {
          playUnoSound();
          onCallUno();
        }}
        disabled={cardsLeft > 2 || hasCalledUno}
        className={`relative px-6 py-2.5 rounded-full font-black text-lg tracking-wider uppercase transition-all transform shadow-xl flex items-center gap-2 ${
          hasCalledUno
            ? 'bg-emerald-600/60 text-emerald-200 border-2 border-emerald-400 cursor-default'
            : cardsLeft <= 2
            ? 'bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 text-white border-2 border-yellow-300 animate-pulse hover:scale-110 active:scale-95 shadow-red-500/50'
            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
        }`}
      >
        <Flame className={`w-5 h-5 ${cardsLeft <= 2 && !hasCalledUno ? 'text-yellow-300 animate-bounce' : ''}`} />
        <span>{hasCalledUno ? 'UNO! CALLED' : 'YELL UNO!'}</span>
      </button>

      {/* Catch UNO Challenge Button */}
      {canCatchUno && (
        <button
          onClick={onCatchUno}
          className="px-5 py-2.5 rounded-full font-black text-sm tracking-wide bg-gradient-to-r from-purple-600 to-pink-600 text-white border-2 border-pink-400 shadow-xl shadow-pink-500/40 animate-bounce hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <ShieldAlert className="w-5 h-5 text-yellow-300" />
          <span>CATCH {vulnerablePlayerName || 'THEM'}! (+2 Cards)</span>
        </button>
      )}

      {/* Draw / Pass Controls */}
      {canDraw && (
        <button
          onClick={() => {
            playDrawSound();
            onDrawCard();
          }}
          className="px-5 py-2.5 rounded-full font-bold text-sm tracking-wide bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 shadow-lg shadow-blue-600/30 active:scale-95 flex items-center gap-2"
        >
          <Layers className="w-4 h-4" />
          <span>Draw 1 Card</span>
        </button>
      )}

      {canPass && (
        <button
          onClick={onPassTurn}
          className="px-5 py-2.5 rounded-full font-bold text-sm tracking-wide bg-amber-600 hover:bg-amber-500 text-white border border-amber-400 shadow-lg shadow-amber-600/30 active:scale-95 flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Pass Turn</span>
        </button>
      )}
    </div>
  );
}
