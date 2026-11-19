import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Smile, X } from 'lucide-react';
import UserAvatar from './UserAvatar';

export default function ChatDrawer({
  isOpen,
  onClose,
  messages = [],
  onSendMessage,
  onSendReaction
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const emojis = ['🔥', '😂', '👑', '😱', '💥', '🃏', '🥳', '💀'];

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border-2 border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[460px] animate-fade-in">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-yellow-400" />
          <span className="font-black text-sm text-white">Game Chat</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Emoji Reactions Bar */}
      <div className="px-3 py-2 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between overflow-x-auto gap-1">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSendReaction(emoji)}
            className="text-lg p-1 hover:scale-125 transition active:scale-95"
            title={`React ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Message List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            Say hi to your friends or cheer them on!
          </div>
        ) : (
          messages.map((m) => {
            if (m.isSystem) {
              return (
                <div
                  key={m.id}
                  className="text-center my-1.5 py-1 px-2.5 rounded-full bg-slate-800/40 text-[11px] text-yellow-300/80 font-medium border border-yellow-500/10"
                >
                  {m.text}
                </div>
              );
            }
            return (
              <div key={m.id} className="flex items-start gap-2">
                <UserAvatar avatarId={m.avatar} size="sm" showBadge={false} />
                <div className="flex-1 bg-slate-800/80 rounded-2xl rounded-tl-none p-2.5 border border-slate-700/60">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-slate-200">{m.sender}</span>
                    <span className="text-[9px] text-slate-400">{m.time}</span>
                  </div>
                  <p className="text-slate-300 break-words">{m.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-2.5 border-t border-slate-800 bg-slate-950/70 flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-yellow-400"
        />
        <button
          type="submit"
          className="p-2 rounded-xl bg-yellow-500 text-slate-950 hover:bg-yellow-400 transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
