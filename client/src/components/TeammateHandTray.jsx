import React, { useState } from 'react';
import { Users, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import UserAvatar from './UserAvatar';
import Card from './Card';

export default function TeammateHandTray({ teammates = [], currentColor, topDiscard }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!teammates || teammates.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto my-2 px-2 z-20">
      <div className="bg-slate-900/90 border-2 border-emerald-500/40 rounded-2xl p-2.5 sm:p-3 shadow-xl backdrop-blur-md">
        {/* Tray Header */}
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-black text-xs sm:text-sm text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Teammate Cards (Team Vision)</span>
              <span className="text-[10px] font-normal text-slate-400 lowercase">
                - only your team can see this
              </span>
            </span>
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold px-2 py-0.5 rounded-lg hover:bg-slate-800 transition"
          >
            {collapsed ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Show</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide</span>
              </>
            )}
          </button>
        </div>

        {/* Teammate Hands Grid */}
        {!collapsed && (
          <div className="space-y-2.5">
            {teammates.map((teammate) => (
              <div
                key={teammate.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80"
              >
                {/* Teammate info chip */}
                <div className="flex items-center gap-2 shrink-0 pr-2 sm:border-r sm:border-slate-800 min-w-[130px]">
                  <UserAvatar avatarId={teammate.avatar} size="sm" showBadge={false} />
                  <div>
                    <span className="font-bold text-xs text-white block truncate max-w-[100px]">
                      {teammate.username}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      {teammate.cardCount} cards in hand
                    </span>
                  </div>
                </div>

                {/* Face-up cards of teammate */}
                <div className="flex-1 overflow-x-auto py-1 flex items-center gap-1.5 max-w-full">
                  {teammate.hand && teammate.hand.length > 0 ? (
                    teammate.hand.map((c, i) => (
                      <div key={c.id || i} className="shrink-0 transform hover:scale-105 transition">
                        <Card card={c} isSmall />
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">No cards</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
