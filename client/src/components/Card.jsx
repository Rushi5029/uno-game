import React from 'react';

/**
 * Authentic Mattel-style Physical UNO Card
 * Matches the official cards featured in UNO tutorials & gameplay
 */
export default function Card({
  card,
  isPlayable = false,
  onClick = null,
  isSmall = false,
  isFacedown = false,
  count = null,
  rotation = 0,
  translateY = 0,
  animDuration = '0.35s',
  isDragging = false,
  style = {},
  onTouchStart,
  onTouchMove,
  onTouchEnd
}) {
  // Official Mattel Physical Card Dimensions
  // Aspect ratio ~ 1.5 : 1
  const sizeClasses = isSmall
    ? 'w-11 h-16 rounded-lg border-[2px]'
    : 'w-[72px] h-[108px] xs:w-[84px] xs:h-[126px] sm:w-[96px] sm:h-[144px] rounded-xl border-[3px] sm:border-[4px]';

  // Face-down physical card back (Solid Red with Black/Yellow UNO Oval)
  if (isFacedown) {
    return (
      <div
        className={`relative ${sizeClasses} bg-[#D71921] border-white shadow-2xl select-none flex items-center justify-center overflow-hidden transition-all`}
        style={{
          transform: `rotate(${rotation}deg) translateY(${translateY}px)`,
          transitionDuration: isDragging ? '0s' : animDuration,
          ...style
        }}
      >
        {/* Black oval in center with gold/yellow border */}
        <div className="w-[110%] h-[58%] bg-black rounded-[50%] transform -rotate-[28deg] border-2 border-[#FFD000] flex items-center justify-center shadow-lg">
          <div className="transform rotate-[28deg] flex items-center justify-center">
            {/* Iconic official-style UNO wordmark */}
            <span
              className="font-black italic tracking-tighter text-[#D71921] text-xs sm:text-base font-sans select-none drop-shadow-[0_2px_0_#FFD000]"
              style={{
                WebkitTextStroke: '1px #FFD000',
                letterSpacing: '-1px'
              }}
            >
              UNO
            </span>
          </div>
        </div>

        {/* Card count tag if stacked */}
        {count !== null && (
          <div className="absolute bottom-1 bg-black/85 text-yellow-300 font-black text-[9px] sm:text-[11px] px-1.5 py-0.2 rounded-full border border-yellow-400">
            {count}
          </div>
        )}
      </div>
    );
  }

  if (!card) return null;

  // Official Card Colors
  const COLOR_MAP = {
    red: {
      bg: 'bg-[#D71921]',
      text: 'text-[#D71921]',
      hex: '#D71921',
      dark: '#B01018'
    },
    yellow: {
      bg: 'bg-[#F9A825]',
      text: 'text-[#E65100]',
      hex: '#F9A825',
      dark: '#C77700'
    },
    green: {
      bg: 'bg-[#2E7D32]',
      text: 'text-[#1B5E20]',
      hex: '#2E7D32',
      dark: '#144617'
    },
    blue: {
      bg: 'bg-[#0066CC]',
      text: 'text-[#004C99]',
      hex: '#0066CC',
      dark: '#003366'
    },
    wild: {
      bg: 'bg-[#18181B]',
      text: 'text-white',
      hex: '#18181B',
      dark: '#09090B'
    }
  };

  const currentColorConfig = COLOR_MAP[card.color] || COLOR_MAP.wild;

  // Corner symbol representation
  const renderCornerSymbol = () => {
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

  // Center symbol / graphic matching physical cards
  const renderCenterGraphic = () => {
    switch (card.value) {
      case 'skip':
        return (
          <svg viewBox="0 0 100 100" className="w-8 h-8 sm:w-12 sm:h-12">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={currentColorConfig.hex}
              strokeWidth="16"
            />
            <line
              x1="22"
              y1="22"
              x2="78"
              y2="78"
              stroke={currentColorConfig.hex}
              strokeWidth="16"
              strokeLinecap="round"
            />
          </svg>
        );

      case 'reverse':
        return (
          <div className="flex flex-col items-center justify-center gap-1 sm:gap-1.5 transform rotate-[25deg]">
            {/* Top arrow pointing right */}
            <div className="flex items-center" style={{ color: currentColorConfig.hex }}>
              <span className="font-black text-base sm:text-2xl leading-none">➔</span>
            </div>
            {/* Bottom arrow pointing left */}
            <div className="flex items-center" style={{ color: currentColorConfig.hex }}>
              <span className="font-black text-base sm:text-2xl leading-none">⬅</span>
            </div>
          </div>
        );

      case 'draw2':
        return (
          <div className="flex flex-col items-center justify-center">
            <span
              className={`font-black text-2xl sm:text-4xl ${currentColorConfig.text} font-sans leading-none`}
              style={{
                textShadow: '0 2px 2px rgba(0,0,0,0.25)'
              }}
            >
              +2
            </span>
          </div>
        );

      case 'wild':
        return (
          <div className="w-8 h-8 sm:w-13 sm:h-13 rounded-full overflow-hidden grid grid-cols-2 grid-rows-2 border-2 border-slate-900 shadow-md transform -rotate-12">
            <div className="bg-[#D71921]"></div>
            <div className="bg-[#0066CC]"></div>
            <div className="bg-[#F9A825]"></div>
            <div className="bg-[#2E7D32]"></div>
          </div>
        );

      case 'wild_draw4':
        return (
          <div className="flex flex-col items-center justify-center">
            <div className="flex -space-x-2 sm:-space-x-3 mb-0.5">
              <div className="w-3 h-5 sm:w-4 sm:h-6 bg-[#D71921] rounded border border-white transform -rotate-12"></div>
              <div className="w-3 h-5 sm:w-4 sm:h-6 bg-[#0066CC] rounded border border-white transform rotate-6"></div>
              <div className="w-3 h-5 sm:w-4 sm:h-6 bg-[#2E7D32] rounded border border-white transform rotate-18"></div>
              <div className="w-3 h-5 sm:w-4 sm:h-6 bg-[#F9A825] rounded border border-white transform rotate-28"></div>
            </div>
            <span
              className="font-black text-xl sm:text-3xl text-slate-950 font-sans leading-none"
              style={{
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              +4
            </span>
          </div>
        );

      default:
        // Physical UNO Number: Bold, thick sans-serif with subtle depth
        return (
          <span
            className={`font-black text-3xl sm:text-5xl ${currentColorConfig.text} font-sans leading-none select-none`}
            style={{
              textShadow: '0 2px 3px rgba(0,0,0,0.2)'
            }}
          >
            {card.value}
          </span>
        );
    }
  };

  return (
    <div
      onClick={isPlayable && onClick ? onClick : undefined}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={`uno-card-human relative ${sizeClasses} ${currentColorConfig.bg} border-white shadow-xl select-none flex flex-col justify-between overflow-hidden cursor-default transition-all ${
        isPlayable
          ? 'uno-card-playable hover:scale-105 cursor-pointer'
          : 'opacity-90'
      }`}
      style={{
        transform: `rotate(${rotation}deg) translateY(${translateY}px)`,
        transitionDuration: isDragging ? '0s' : animDuration,
        transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
        touchAction: 'none',
        ...style
      }}
    >
      {/* Top Left Corner Index */}
      <div className="relative z-10 flex items-center font-black text-xs sm:text-sm text-white leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] pl-1 pt-1 font-sans">
        {renderCornerSymbol()}
      </div>

      {/* SOLID WHITE OVAL (Exact physical UNO specification) */}
      <div className="relative flex-1 flex items-center justify-center my-0.5">
        <div
          className="w-[88%] h-[84%] bg-white rounded-[50%] flex items-center justify-center transform -rotate-[26deg] shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] border border-slate-100"
        >
          {/* Content inside white oval */}
          <div className="transform rotate-[26deg] flex items-center justify-center">
            {renderCenterGraphic()}
          </div>
        </div>
      </div>

      {/* Bottom Right Corner Index */}
      <div className="relative z-10 flex items-center justify-end font-black text-xs sm:text-sm text-white leading-none rotate-180 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] pr-1 pb-1 font-sans">
        {renderCornerSymbol()}
      </div>
    </div>
  );
}
