import React from 'react';
import { Ban, RotateCw, Plus } from 'lucide-react';

export default function Card({
  card,
  isPlayable = false,
  onClick = null,
  isSmall = false,
  isFacedown = false,
  count = null,
  rotation = 0
}) {
  if (isFacedown) {
    return (
      <div
        className={`relative ${
          isSmall ? 'w-10 h-14' : 'w-20 h-28 sm:w-24 sm:h-36'
        } rounded-xl bg-gradient-to-br from-red-600 via-yellow-500 to-red-600 p-1 shadow-lg border-2 border-white select-none flex items-center justify-center transform transition-transform`}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <div className="w-full h-full bg-slate-950 rounded-lg flex flex-col items-center justify-center border border-yellow-400/40">
          <span className="font-black text-xs sm:text-base tracking-widest text-yellow-400 rotate-[-20deg] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            UNO
          </span>
          {count !== null && (
            <span className="text-[10px] sm:text-xs font-bold text-slate-300 mt-1">
              {count}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (!card) return null;

  const colorStyles = {
    red: 'bg-red-600 text-red-600',
    yellow: 'bg-yellow-400 text-yellow-500',
    green: 'bg-emerald-600 text-emerald-600',
    blue: 'bg-blue-600 text-blue-600',
    wild: 'bg-slate-900 text-white'
  };

  const getCardIcon = () => {
    switch (card.value) {
      case 'skip':
        return <Ban className="w-8 h-8 sm:w-10 sm:h-10 text-white stroke-[2.5]" />;
      case 'reverse':
        return <RotateCw className="w-8 h-8 sm:w-10 sm:h-10 text-white stroke-[2.5]" />;
      case 'draw2':
        return <span className="text-xl sm:text-3xl font-black text-white">+2</span>;
      case 'wild':
        return (
          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full grid grid-cols-2 grid-rows-2 overflow-hidden border border-white/50 shadow-inner">
            <div className="bg-red-600"></div>
            <div className="bg-blue-600"></div>
            <div className="bg-yellow-400"></div>
            <div className="bg-emerald-600"></div>
          </div>
        );
      case 'wild_draw4':
        return (
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full grid grid-cols-2 grid-rows-2 overflow-hidden border border-white/40">
              <div className="bg-red-600"></div>
              <div className="bg-blue-600"></div>
              <div className="bg-yellow-400"></div>
              <div className="bg-emerald-600"></div>
            </div>
            <span className="text-base sm:text-xl font-black text-white drop-shadow-md">+4</span>
          </div>
        );
      default:
        return (
          <span className="text-3xl sm:text-5xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            {card.value}
          </span>
        );
    }
  };

  const getCornerText = () => {
    switch (card.value) {
      case 'skip':
        return '⊘';
      case 'reverse':
        return '⇄';
      case 'draw2':
        return '+2';
      case 'wild':
        return '★';
      case 'wild_draw4':
        return '+4';
      default:
        return card.value;
    }
  };

  const isWild = card.color === 'wild';

  return (
    <div
      onClick={isPlayable && onClick ? onClick : undefined}
      className={`uno-card relative ${
        isSmall ? 'w-12 h-18 text-xs' : 'w-20 h-28 sm:w-24 sm:h-36'
      } rounded-xl p-1.5 shadow-xl border-2 select-none flex flex-col justify-between overflow-hidden cursor-default ${
        colorStyles[card.color] || 'bg-slate-800'
      } ${
        isPlayable
          ? 'uno-card-playable border-white cursor-pointer hover:border-yellow-300'
          : 'border-white/70 opacity-90'
      }`}
      style={{
        transform: `rotate(${rotation}deg)`
      }}
    >
      {/* Top Left Corner */}
      <div className="flex items-center text-xs sm:text-sm font-black text-white leading-none drop-shadow">
        {getCornerText()}
      </div>

      {/* Center Oval graphic */}
      <div className="relative flex-1 flex items-center justify-center my-0.5">
        <div
          className={`w-[85%] h-[82%] rounded-[50%] flex items-center justify-center transform -rotate-[24deg] shadow-inner ${
            isWild
              ? 'bg-gradient-to-tr from-slate-950 to-slate-800 border-2 border-white/30'
              : 'bg-white/20 border-2 border-white/40'
          }`}
        >
          <div className="transform rotate-[24deg] flex items-center justify-center">
            {getCardIcon()}
          </div>
        </div>
      </div>

      {/* Bottom Right Corner */}
      <div className="flex items-center justify-end text-xs sm:text-sm font-black text-white leading-none rotate-180 drop-shadow">
        {getCornerText()}
      </div>
    </div>
  );
}
