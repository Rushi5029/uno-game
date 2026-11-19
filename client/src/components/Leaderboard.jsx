import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw, X, Award, Flame } from 'lucide-react';
import UserAvatar from './UserAvatar';
import RankBadge from './RankBadge';

export default function Leaderboard({ isOpen, onClose }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard?limit=10');
      const data = await res.json();
      setLeaders(data.leaderboard || []);
    } catch (err) {
      console.error('Failed to load leaderboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-500/20 rounded-2xl border border-yellow-500/40 text-yellow-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                Top 10 UNO Champions
              </h2>
              <p className="text-xs text-slate-400">
                Ranked by victories & game performance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLeaderboard}
              disabled={loading}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Podium for Top 3 */}
        {leaders.length >= 3 && (
          <div className="px-6 pt-6 pb-2 grid grid-cols-3 gap-3 items-end border-b border-slate-800/60 bg-gradient-to-b from-slate-900 to-slate-950">
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <div className="mb-2">
                <RankBadge rank={2} size="sm" />
              </div>
              <UserAvatar avatarId={leaders[1].avatar} size="md" showBadge={false} />
              <span className="text-xs font-bold text-slate-200 mt-1 truncate max-w-[90px]">
                {leaders[1].username}
              </span>
              <span className="text-[11px] font-black text-slate-400">
                {leaders[1].wins} Wins
              </span>
              <div className="w-full h-16 bg-slate-800/80 rounded-t-xl mt-2 flex items-center justify-center font-black text-lg text-slate-400 border-t-2 border-slate-500">
                2
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center">
              <div className="mb-2">
                <RankBadge rank={1} size="lg" />
              </div>
              <UserAvatar avatarId={leaders[0].avatar} size="lg" showBadge={false} />
              <span className="text-sm font-black text-amber-300 mt-1 truncate max-w-[100px]">
                {leaders[0].username}
              </span>
              <span className="text-xs font-black text-yellow-400">
                {leaders[0].wins} Wins
              </span>
              <div className="w-full h-24 bg-gradient-to-t from-yellow-900/60 to-yellow-600/40 rounded-t-xl mt-2 flex items-center justify-center font-black text-2xl text-yellow-300 border-t-2 border-yellow-400 shadow-lg shadow-yellow-500/20">
                1
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <div className="mb-2">
                <RankBadge rank={3} size="sm" />
              </div>
              <UserAvatar avatarId={leaders[2].avatar} size="md" showBadge={false} />
              <span className="text-xs font-bold text-slate-200 mt-1 truncate max-w-[90px]">
                {leaders[2].username}
              </span>
              <span className="text-[11px] font-black text-amber-500">
                {leaders[2].wins} Wins
              </span>
              <div className="w-full h-12 bg-amber-950/40 rounded-t-xl mt-2 flex items-center justify-center font-black text-base text-amber-600 border-t-2 border-amber-700">
                3
              </div>
            </div>
          </div>
        )}

        {/* List of 1-10 */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {leaders.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No players on the leaderboard yet. Play a game to make history!
            </div>
          ) : (
            leaders.map((player) => (
              <div
                key={player.username}
                className={`p-3 rounded-2xl flex items-center justify-between border transition ${
                  player.rank === 1
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : player.rank === 2
                    ? 'bg-slate-700/20 border-slate-500/30'
                    : player.rank === 3
                    ? 'bg-amber-700/10 border-amber-700/30'
                    : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 text-center font-black text-sm text-slate-400">
                    #{player.rank}
                  </div>

                  <div className="relative">
                    <UserAvatar avatarId={player.avatar} size="sm" showBadge={false} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">
                        {player.username}
                      </span>
                      {player.rank <= 3 && <RankBadge rank={player.rank} />}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>Played: {player.gamesPlayed}</span>
                      <span>•</span>
                      <span>Win Rate: {player.winRate}%</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-sm text-emerald-400">
                    {player.wins}W / {player.losses}L
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold">
                    {player.score || 0} pts
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
