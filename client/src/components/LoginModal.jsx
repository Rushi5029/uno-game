import React, { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { AVATARS } from '../utils/avatars';

export default function LoginModal({ onLogin }) {
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar-1');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    if (username.trim().length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          avatar: selectedAvatar
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="text-center mb-6 relative">
          <div className="inline-block bg-gradient-to-r from-red-600 via-yellow-500 to-emerald-500 p-1 rounded-2xl mb-3 shadow-lg">
            <div className="bg-slate-950 px-4 py-1.5 rounded-xl flex items-center gap-1.5">
              <span className="font-black text-2xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500">
                UNO!
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                ONLINE
              </span>
            </div>
          </div>
          <h2 className="text-2xl font-black text-white">Join The Game</h2>
          <p className="text-slate-400 text-xs mt-1">
            Pick a username to identify yourself to your friends! (No password needed)
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Your Player Name
            </label>
            <input
              type="text"
              required
              autoFocus
              maxLength={15}
              placeholder="e.g. Alex, Rahul, Champion..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border-2 border-slate-700 text-white font-semibold text-base focus:outline-none focus:border-yellow-400 transition shadow-inner"
            />
          </div>

          {/* Avatar Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Choose Your Character Avatar
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {AVATARS.map((av) => (
                <button
                  type="button"
                  key={av.id}
                  onClick={() => setSelectedAvatar(av.id)}
                  className={`p-2.5 rounded-2xl flex flex-col items-center justify-center border transition ${
                    selectedAvatar === av.id
                      ? 'border-yellow-400 bg-yellow-400/20 scale-105 shadow-md shadow-yellow-500/20'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl">{av.emoji}</span>
                  <span className="text-[10px] text-slate-400 mt-1 truncate max-w-full font-medium">
                    {av.label.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl font-black text-slate-950 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-xl shadow-yellow-500/20 active:scale-95 transition flex items-center justify-center gap-2 tracking-wider uppercase text-sm"
          >
            {loading ? (
              <span>Connecting...</span>
            ) : (
              <>
                <span>Enter Game</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
