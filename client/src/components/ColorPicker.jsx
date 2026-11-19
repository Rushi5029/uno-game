import React from 'react';

export default function ColorPicker({ onSelectColor }) {
  const colors = [
    { id: 'red', name: 'Red', bg: 'bg-red-600 hover:bg-red-500 shadow-red-500/50' },
    { id: 'yellow', name: 'Yellow', bg: 'bg-yellow-400 hover:bg-yellow-300 shadow-yellow-400/50 text-slate-900' },
    { id: 'green', name: 'Green', bg: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/50' },
    { id: 'blue', name: 'Blue', bg: 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/50' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
        <h3 className="text-2xl font-black text-white mb-2 tracking-wide">
          🌈 Choose Color
        </h3>
        <p className="text-slate-400 text-sm mb-6">
          Pick the active color to continue play
        </p>

        <div className="grid grid-cols-2 gap-4">
          {colors.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectColor(c.id)}
              className={`${c.bg} py-5 rounded-xl font-black text-lg tracking-wider uppercase shadow-lg transform transition-all active:scale-95 hover:scale-105 border-2 border-white/30`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
