import React, { useState, useEffect } from 'react';
import { Plus, Users, LogIn, Sparkles, RefreshCw, Shield, Crown } from 'lucide-react';
import UserAvatar from './UserAvatar';
import RankBadge from './RankBadge';

export default function Lobby({
  user,
  onCreateRoom,
  onJoinRoom
}) {
  const [joinCode, setJoinCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [gameMode, setGameMode] = useState('solo'); // 'solo' or 'team'
  const [teamCount, setTeamCount] = useState(2);
  const [publicRooms, setPublicRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [tab, setTab] = useState('join');

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      setPublicRooms(data.rooms || []);
    } catch (err) {
      console.error('Failed to load rooms', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    onJoinRoom(joinCode.trim().toUpperCase());
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    onCreateRoom({ maxPlayers, gameMode, teamCount });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Brand Hero */}
      <div className="text-center mb-8 relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 mb-3 text-xs font-bold text-yellow-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multiplayer Arena • Solo & Team Play (2-10 Players)</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Battle Your Friends in{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-400">
            UNO
          </span>
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
          Play classic solo or team up with your friends in 2v2 / 3v3 mode where teammates can see each other's cards!
        </p>

        {/* User Card */}
        <div className="mt-4 inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <UserAvatar avatarId={user?.avatar} size="sm" showBadge={false} />
          <span className="text-sm font-bold text-slate-200">
            Player: <strong className="text-yellow-400">{user?.username}</strong>
          </span>
          {user?.rank && user?.rank <= 3 && <RankBadge rank={user.rank} />}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="max-w-md mx-auto bg-slate-900/90 border-2 border-slate-700/80 rounded-3xl p-6 shadow-2xl backdrop-blur-md mb-10">
        <div className="flex p-1 bg-slate-950 rounded-2xl mb-6 border border-slate-800">
          <button
            onClick={() => setTab('join')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
              tab === 'join'
                ? 'bg-yellow-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Join Room
          </button>
          <button
            onClick={() => setTab('create')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
              tab === 'create'
                ? 'bg-yellow-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Room
          </button>
        </div>

        {tab === 'join' ? (
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Enter 4-Letter Room Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="e.g. ABCD"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full text-center tracking-widest uppercase text-2xl font-black px-4 py-3 rounded-2xl bg-slate-950 border-2 border-slate-700 text-yellow-400 focus:outline-none focus:border-yellow-400 placeholder:text-slate-700 placeholder:font-normal placeholder:tracking-normal placeholder:text-base"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl font-black text-slate-950 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 shadow-xl shadow-yellow-500/20 active:scale-95 transition flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
            >
              <LogIn className="w-4 h-4 stroke-[3]" />
              <span>Join Game</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {/* Game Mode Choice */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Game Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGameMode('solo')}
                  className={`py-2.5 rounded-xl font-bold text-xs border transition ${
                    gameMode === 'solo'
                      ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  Solo (Free for All)
                </button>
                <button
                  type="button"
                  onClick={() => setGameMode('team')}
                  className={`py-2.5 rounded-xl font-bold text-xs border transition flex items-center justify-center gap-1 ${
                    gameMode === 'team'
                      ? 'border-indigo-400 bg-indigo-500/20 text-indigo-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Team Play</span>
                </button>
              </div>
              {gameMode === 'team' && (
                <p className="text-[11px] text-indigo-300 mt-1.5">
                  ★ Teammates can see each other's cards & win as a team!
                </p>
              )}
            </div>

            {/* Max Players */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Players ({maxPlayers} Players)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[4, 6, 8, 10].map((num) => (
                  <button
                    type="button"
                    key={num}
                    onClick={() => setMaxPlayers(num)}
                    className={`py-2 rounded-xl font-black text-xs border transition ${
                      maxPlayers === num
                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {num} P
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 shadow-xl shadow-emerald-500/20 active:scale-95 transition flex items-center justify-center gap-2 text-sm uppercase tracking-wider mt-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Table</span>
            </button>
          </form>
        )}
      </div>

      {/* Public Rooms List */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-yellow-400" />
            <h3 className="font-black text-white text-base">
              Open Tables Looking for Players
            </h3>
          </div>
          <button
            onClick={fetchRooms}
            disabled={loadingRooms}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRooms ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {publicRooms.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center text-slate-500 text-sm">
            No active open tables. Create one above and invite your friends!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {publicRooms.map((r) => (
              <div
                key={r.roomCode}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-base text-yellow-400">
                      {r.roomCode}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      Host: {r.host}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span>
                      {r.playerCount} / {r.maxPlayers} players
                    </span>
                    {r.gameMode === 'team' && (
                      <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/30">
                        Team Play
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onJoinRoom(r.roomCode)}
                  className="px-4 py-2 rounded-xl font-bold text-xs bg-yellow-400 hover:bg-yellow-300 text-slate-950 transition active:scale-95"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
