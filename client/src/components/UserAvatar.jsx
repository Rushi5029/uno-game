import React from 'react';
import { getAvatarData } from '../utils/avatars';
import RankBadge from './RankBadge';

export default function UserAvatar({
  avatarId,
  rank = null,
  size = 'md',
  showBadge = true,
  className = ''
}) {
  const avatar = getAvatarData(avatarId);

  const sizeClasses = {
    sm: 'w-8 h-8 text-base',
    md: 'w-11 h-11 text-xl',
    lg: 'w-16 h-16 text-3xl',
    xl: 'w-20 h-20 text-4xl'
  };

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      {showBadge && rank && rank <= 3 && (
        <div className="absolute -top-3 z-20">
          <RankBadge rank={rank} size={size === 'lg' || size === 'xl' ? 'lg' : 'sm'} />
        </div>
      )}

      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full overflow-hidden flex items-center justify-center border-2 border-white/20 shadow-md transition-transform ${
          avatar.bg || 'bg-slate-700'
        }`}
      >
        {avatar.isCustomImage ? (
          <img
            src={avatar.url}
            alt="Avatar"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span className="select-none">{avatar.emoji}</span>
        )}
      </div>
    </div>
  );
}
