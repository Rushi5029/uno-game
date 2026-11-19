import React from 'react';
import { X, BookOpen, Layers, Users, Zap, ShieldAlert, Trophy } from 'lucide-react';

export default function RulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-2xl border border-blue-500/40 text-blue-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Official UNO! Rules</h2>
              <p className="text-xs text-slate-400">Everything you need to play & win</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Key Facts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
              <Users className="w-5 h-5 text-yellow-400 shrink-0" />
              <div>
                <div className="text-xs text-slate-400">Players</div>
                <div className="font-bold text-white">2 to 10 (Ages 7+)</div>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
              <Layers className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs text-slate-400">Official Deck</div>
                <div className="font-bold text-white">108 Cards</div>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
              <Zap className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <div className="text-xs text-slate-400">Starting Hand</div>
                <div className="font-bold text-white">7 Cards Each</div>
              </div>
            </div>
          </div>

          {/* Core Rules */}
          <div className="space-y-3">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
              How to Play
            </h3>
            <ol className="list-decimal list-inside space-y-2 pl-2">
              <li>
                <strong className="text-white">Match the Discard Pile:</strong> On your turn, play a card from your hand that matches the top card of the Discard Pile by color, number, or symbol.
              </li>
              <li>
                <strong className="text-white">Draw if Stuck:</strong> If you don't have a playable card, draw one card from the Draw Pile. If it's playable, you can put it down immediately; otherwise, your turn ends.
              </li>
              <li>
                <strong className="text-white">Call "UNO!":</strong> When you play your second-to-last card (leaving you with 1 card), you must yell "UNO!" before the next player takes their turn. If someone catches you and says "UNO" first, you must draw 2 penalty cards.
              </li>
              <li>
                <strong className="text-white">Winning:</strong> The first player to empty their hand wins the round!
              </li>
            </ol>
          </div>

          {/* Action Cards Table */}
          <div className="space-y-3">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Special Action & Wild Cards
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Card</th>
                    <th className="p-3">Color</th>
                    <th className="p-3">Effect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                  <tr>
                    <td className="p-3 font-bold text-white">Skip</td>
                    <td className="p-3 text-slate-400">Red, Yellow, Green, Blue</td>
                    <td className="p-3">The next player loses their turn.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-white">Reverse</td>
                    <td className="p-3 text-slate-400">Red, Yellow, Green, Blue</td>
                    <td className="p-3">Reverses direction of play (clockwise ⇄ counter-clockwise). In 2-player games, acts as a Skip.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-white">Draw Two (+2)</td>
                    <td className="p-3 text-slate-400">Red, Yellow, Green, Blue</td>
                    <td className="p-3">The next player draws 2 cards and loses their turn.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-white">Wild</td>
                    <td className="p-3 text-yellow-400">Any (Wild)</td>
                    <td className="p-3">Play on any color and choose the new color to continue play.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-white">Wild Draw Four (+4)</td>
                    <td className="p-3 text-yellow-400">Any (Wild)</td>
                    <td className="p-3">Choose the new color, plus the next player draws 4 cards and loses their turn!</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
