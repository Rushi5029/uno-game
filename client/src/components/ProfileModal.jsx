import React, { useState } from 'react';
import { X, Check, Camera, Trophy, Swords, Percent } from 'lucide-react';
import { AVATARS } from '../utils/avatars';
import UserAvatar from './UserAvatar';
import RankBadge from './RankBadge';

export default function ProfileModal({ isOpen, onClose, user, onUpdateProfile }) {
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || 'avatar-1');
  const [customUrl, setCustomUrl] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    setSaving(true);
    const finalAvatar = showCustomInput && customUrl.trim() ? customUrl.trim() : selectedAvatar;
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          avatar: finalAvatar
        })
      });
      const data = await res.json();
      if (data.user) {
        onUpdateProfile({ ...user, ...data.user, avatar: finalAvatar });
      }
      onClose();
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white">Player Profile</h2>
            {user.rank && user.rank <= 3 && <RankBadge rank={user.rank} />}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Avatar and Info */}
          <div className="flex flex-col items-center text-center">
            <UserAvatar
              avatarId={showCustomInput && customUrl.trim() ? customUrl.trim() : selectedAvatar}
              rank={user.rank}
              size="xl"
            />
            <div className="mt-3 flex items-center gap-2">
              <span className="text-2xl font-black text-white tracking-wide">
                {user.username}
              </span>
            </div>
            {user.rank ? (
              <span className="text-xs font-bold text-amber-400 mt-1">
                Global Rank: #{user.rank}
              </span>
            ) : (
              <span className="text-xs text-slate-500 mt-1">Unranked</span>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-center">
              <div className="flex items-center justify-center text-yellow-400 mb-1">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-white">{user.wins || 0}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Wins</div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-center">
              <div className="flex items-center justify-center text-rose-400 mb-1">
                <Swords className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-white">{user.losses || 0}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Losses</div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-center">
              <div className="flex items-center justify-center text-emerald-400 mb-1">
                <Percent className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-white">
                {user.gamesPlayed > 0 ? Math.round((user.wins / user.gamesPlayed) * 100) : 0}%
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Win Rate</div>
            </div>
          </div>

          {/* Choose Profile Picture */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider">
                Select Profile Picture
              </label>
              <button
                type="button"
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
              >
                <Camera className="w-3.5 h-3.5" />
                {showCustomInput ? 'Choose Preset' : 'Custom Image URL'}
              </button>
            </div>

            {showCustomInput ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="https://example.com/my-photo.jpg"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500">
                  Paste any public image URL or avatar link.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av.id)}
                    className={`relative p-3 rounded-2xl flex flex-col items-center justify-center transition border ${
                      selectedAvatar === av.id
                        ? 'border-yellow-400 bg-yellow-400/10 scale-105'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-2xl mb-1">{av.emoji}</span>
                    <span className="text-[10px] font-semibold text-slate-400 truncate max-w-full">
                      {av.label.split(' ')[0]}
                    </span>
                    {selectedAvatar === av.id && (
                      <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-slate-950 rounded-full p-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-xl text-sm font-bold bg-yellow-500 hover:bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-500/20 active:scale-95 transition"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
