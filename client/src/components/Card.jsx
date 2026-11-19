import React from 'react';
import { Ban, RotateCw } from 'lucide-react';

export default function Card({
  card,
  isPlayable = false,
  onClick = null,
  isSmall = false,
  isFacedown = false,
  count = null,
  rotation = 0,
  translateY = 0,
  style = {}
}) {
  // Face-down card design (Deck & Opponent hands)
  if (isFacedown) {
    return (
      <div
        className={`relative ${
          isSmall ? 'w-10 h-14' : 'w-20 h-30 sm:w-26 sm:h-38'
        } rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-red-800 p-1 border-2 border-slate-100/90 shadow-xl select-none flex items-center justify-center transform transition-transform deck-stack`}
        style={{
          transform: `rotate(${rotation}deg) translateY(${translateY}px)`,
          ...style
        }}
      >
        {/* Subtle glossy sheen */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/30 pointer-events-none rounded-lg"></div>

        <div className="w-full h-full bg-slate-950 rounded-lg flex flex-col items-center justify-center border border-yellow-400/50 relative overflow-hidden">
          {/* Yellow tilted ellipse */}
          <div className="w-16 h-8 sm:w-20 sm:h-12 bg-gradient-to-tr from-yellow-500 to-amber-300 rounded-[50%] transform -rotate-[28deg] flex items-center justify-center shadow-lg border border-white/60">
            <span className="font-black text-xs sm:text-base tracking-tighter text-red-600 transform drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-sans">
              UNO
            </span>
          </div>
          {count !== null && (
            <span className="absolute bottom-1 text-[9px] sm:text-[11px] font-black text-yellow-300 bg-slate-900/90 px-1.5 py-0.2 rounded-full border border-yellow-400/40">
              {count}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (!card) return null;

  const colorStyles = {
    red: 'bg-gradient-to-br from-red-500 via-red-600 to-red-700',
    yellow: 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-slate-950',
    green: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700',
    blue: 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800',
    wild: 'bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white'
  };

  const getCardIcon = () => {
    switch (card.value) {
      case 'skip':
        return <Ban className="w-8 h-8 sm:w-11 sm:h-11 text-white stroke-[3] drop-shadow-md" />;
      case 'reverse':
        return <RotateCw className="w-8 h-8 sm:w-11 sm:h-11 text-white stroke-[3] drop-shadow-md" />;
      case 'draw2':
        return (
          <span className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)]">
            +2
          </span>
        );
      case 'wild':
        return (
          <div className="w-9 h-9 sm:w-13 sm:h-13 rounded-full grid grid-cols-2 grid-rows-2 overflow-hidden border-2 border-white/90 shadow-xl transform -rotate-12">
            <div className="bg-red-600"></div>
            <div className="bg-blue-600"></div>
            <div className="bg-yellow-400"></div>
            <div className="bg-emerald-600"></div>
          </div>
        );
      case 'wild_draw4':
        return (
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full grid grid-cols-2 grid-rows-2 overflow-hidden border-2 border-white/80 shadow-md">
              <div className="bg-red-600"></div>
              <div className="bg-blue-600"></div>
              <div className="bg-yellow-400"></div>
              <div className="bg-emerald-600"></div>
            </div>
            <span className="text-lg sm:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] -mt-1">
              +4
            </span>
          </div>
        );
      default:
        return (
          <span className="text-3xl sm:text-5xl font-black text-white drop-shadow-[0_3px_4px_rgba(0,0,0,0.7)] font-sans">
            {card.value}
          </span>
        );
    }
  };

  const getCornerText = () => {
    switch (card.value) {
      case 'skip': return '⊘';
      case 'reverse': return '⇄';
      case 'draw2': return '+2';
      case 'wild': return '★';
      case 'wild_draw4': return '+4';
      default: return card.value;
    }
  };

  const isWild = card.color === 'wild';

  return (
    <div
      onClick={isPlayable && onClick ? onClick : undefined}
      className={`uno-card-human relative ${
        isSmall ? 'w-11 h-16 text-xs' : 'w-20 h-30 sm:w-26 sm:h-38'
      } rounded-xl p-1.5 border-2 select-none flex flex-col justify-between overflow-hidden cursor-default ${
        colorStyles[card.color] || 'bg-slate-800'
      } ${
        isPlayable
          ? 'uno-card-playable border-white hover:border-yellow-300 cursor-pointer'
          : 'border-white/80 opacity-95'
      }`}
      style={{
        transform: `rotate(${rotation}deg) translateY(${translateY}px)`,
        ...style
      }}
    >
      {/* Glossy Reflection overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none rounded-lg"></div>

      {/* Top Left Corner */}
      <div className="relative z-10 flex items-center text-xs sm:text-sm font-black text-white leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] pl-0.5 pt-0.5">
        {getCornerText()}
      </div>

      {/* Center Iconic Oval */}
      <div className="relative flex-1 flex items-center justify-center my-0.5">
        <div
          className={`w-[88%] h-[84%] rounded-[50%] flex items-center justify-center transform -rotate-[26deg] shadow-inner ${
            isWild
              ? 'bg-gradient-to-tr from-slate-950 to-slate-800 border-2 border-white/40'
              : 'bg-white/25 border-2 border-white/50 backdrop-blur-[1px]'
          }`}
        >
          <div className="transform rotate-[26deg] flex items-center justify-center">
            {getCardIcon()}
          </div>
        </div>
      </div>

      {/* Bottom Right Corner */}
      <div className="relative z-10 flex items-center justify-end text-xs sm:text-sm font-black text-white leading-none rotate-180 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] pr-0.5 pb-0.5">
        {getCornerText()}
      </div>
    </div>
  );
}
