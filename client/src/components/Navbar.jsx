import React from 'react';
import { Trophy, Volume2, VolumeX, BookOpen, User, Flame } from 'lucide-react';
import UserAvatar from './UserAvatar';
import RankBadge from './RankBadge';

export default function Navbar({
  user,
  onOpenProfile,
  onOpenLeaderboard,
  onOpenRules,
  soundOn,
  onToggleSound
}) {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-black text-xl sm:text-2xl tracking-tighter">
            <span className="px-2 py-0.5 rounded-lg bg-red-600 text-white shadow-md shadow-red-600/30">
              U
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/30">
              N
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
              O
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white shadow-md shadow-blue-600/30">
              !
            </span>
          </div>
          <span className="hidden sm:inline-block text-xs font-bold text-slate-400 border-l border-slate-700 pl-3 uppercase tracking-widest">
            Multiplayer 2-10P
          </span>
        </div>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Rules Button */}
          <button
            onClick={onOpenRules}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
            title="UNO Rules"
          >
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span className="hidden md:inline">Rules</span>
          </button>

          {/* Leaderboard Button */}
          <button
            onClick={onOpenLeaderboard}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
            title="Top 10 Rankings"
          >
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="hidden md:inline">Top 10</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition"
            title={soundOn ? 'Mute Sound' : 'Unmute Sound'}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* User Profile Pill */}
          {user && (
            <button
              onClick={onOpenProfile}
              className="relative flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-yellow-400/50 transition group shadow-md"
            >
              {/* Badge on top of username if top 3 */}
              {user.rank && user.rank <= 3 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <RankBadge rank={user.rank} size="sm" />
                </div>
              )}

              <UserAvatar avatarId={user.avatar} size="sm" showBadge={false} />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-black text-white group-hover:text-yellow-400 transition truncate max-w-[100px]">
                  {user.username}
                </div>
                <div className="text-[10px] text-emerald-400 font-bold leading-none">
                  {user.wins || 0} Wins
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
