import React from 'react';
import { Crown, Medal } from 'lucide-react';

export default function RankBadge({ rank, size = 'sm', showIconOnly = false }) {
  if (!rank || rank > 3) return null;

  if (rank === 1) {
    return (
      <div
        className={`inline-flex items-center gap-1 font-bold text-slate-900 rounded-full shadow-md badge-gold-shimmer animate-bounce-slow ${
          size === 'lg' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]'
        }`}
        title="1st Place Champion"
      >
        <Crown className={size === 'lg' ? 'w-3.5 h-3.5 fill-amber-900 text-amber-900' : 'w-2.5 h-2.5 fill-amber-900 text-amber-900'} />
        {!showIconOnly && <span>1st Rank</span>}
      </div>
    );
  }

  if (rank === 2) {
    return (
      <div
        className={`inline-flex items-center gap-1 font-bold text-slate-900 rounded-full shadow-md badge-silver-shimmer ${
          size === 'lg' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]'
        }`}
        title="2nd Place"
      >
        <Medal className={size === 'lg' ? 'w-3.5 h-3.5 text-slate-800' : 'w-2.5 h-2.5 text-slate-800'} />
        {!showIconOnly && <span>2nd Rank</span>}
      </div>
    );
  }

  if (rank === 3) {
    return (
      <div
        className={`inline-flex items-center gap-1 font-bold text-white rounded-full shadow-md badge-bronze-shimmer ${
          size === 'lg' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]'
        }`}
        title="3rd Place"
      >
        <Medal className={size === 'lg' ? 'w-3.5 h-3.5 text-amber-200' : 'w-2.5 h-2.5 text-amber-200'} />
        {!showIconOnly && <span>3rd Rank</span>}
      </div>
    );
  }

  return null;
}
