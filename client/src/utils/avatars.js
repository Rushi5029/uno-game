export const AVATARS = [
  { id: 'avatar-1', label: 'Fox Ace', emoji: '🦊', bg: 'bg-orange-500' },
  { id: 'avatar-2', label: 'Cyber Wolf', emoji: '🐺', bg: 'bg-indigo-600' },
  { id: 'avatar-3', label: 'Panda King', emoji: '🐼', bg: 'bg-emerald-600' },
  { id: 'avatar-4', label: 'Tiger Uno', emoji: '🐯', bg: 'bg-amber-500' },
  { id: 'avatar-5', label: 'Lion Master', emoji: '🦁', bg: 'bg-yellow-600' },
  { id: 'avatar-6', label: 'Dragon Pro', emoji: '🐲', bg: 'bg-rose-600' },
  { id: 'avatar-7', label: 'Eagle Eye', emoji: '🦅', bg: 'bg-sky-600' },
  { id: 'avatar-8', label: 'Alien Joker', emoji: '👽', bg: 'bg-purple-600' }
];

export const getAvatarData = (avatarId) => {
  const found = AVATARS.find((a) => a.id === avatarId);
  if (found) return found;
  // If it's a custom URL
  if (avatarId && (avatarId.startsWith('http://') || avatarId.startsWith('https://') || avatarId.startsWith('data:image'))) {
    return { id: avatarId, isCustomImage: true, url: avatarId };
  }
  return AVATARS[0];
};
