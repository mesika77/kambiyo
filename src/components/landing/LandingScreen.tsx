import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';

const DIFFICULTY_LABELS = {
  easy: { label: 'EASY', desc: 'forgetful & slow' },
  medium: { label: 'MEDIUM', desc: 'casual player' },
  hard: { label: 'HARD', desc: 'perfect memory' },
} as const;

const HOW_TO_PLAY_SECTIONS = [
  {
    title: 'Goal',
    content: 'Have the lowest total hand value when someone calls KAMBIYO. Lower is better!',
  },
  {
    title: 'Setup',
    content: 'Everyone gets 4 face-down cards. Before play starts, peek at 2 of your bottom cards — remember them!',
  },
  {
    title: 'Your Turn',
    content: 'Draw from the deck or the discard pile. Then either swap the drawn card with one in your hand (discarding the old one), or discard it directly.',
  },
  {
    title: 'Slap!',
    content: 'Any time a card lands on the discard pile, tap one of your hand cards if it matches the rank — you get rid of it. Wrong guess = you draw a penalty card.',
  },
  {
    title: 'Power Cards',
    items: [
      '7 / 8 — peek one of your own cards',
      '9 / 10 — peek an opponent\'s card',
      'J — blind swap: swap any two cards without seeing them',
      'Q — peek any card, then optionally swap',
      'Black K — peek 2 cards, then optionally swap',
    ],
  },
  {
    title: 'Card Values',
    items: [
      'A = 1 pt',
      '2–10 = face value',
      'J = 11 pts, Q = 12 pts',
      'Black K = 13 pts',
      'Red K = −1 pt',
      'Joker = 0 pts',
    ],
  },
  {
    title: 'Calling KAMBIYO',
    content: 'When you think you have the lowest hand, call KAMBIYO on your turn. All cards flip — if you\'re lowest you win, otherwise you get a +5 penalty.',
  },
];

function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-sm mx-4 mb-6 bg-[#0F0F1A] border border-[#9B5DE5]/40 rounded-3xl overflow-hidden"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="font-['Space_Grotesk'] font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-[#9B5DE5] to-[#00F5FF]">
            HOW TO PLAY
          </h2>
          <button
            className="w-8 h-8 rounded-full bg-[#1A1A2E] border border-[#9B5DE5]/30 flex items-center justify-center text-[#F0F0FF]/60 text-sm font-bold"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[65vh] px-5 pb-6 flex flex-col gap-4">
          {HOW_TO_PLAY_SECTIONS.map(s => (
            <div key={s.title}>
              <p className="text-[#00F5FF] text-xs font-bold uppercase tracking-widest mb-1">{s.title}</p>
              {s.content && (
                <p className="text-[#F0F0FF]/75 text-sm leading-relaxed">{s.content}</p>
              )}
              {s.items && (
                <ul className="flex flex-col gap-0.5">
                  {s.items.map(item => (
                    <li key={item} className="text-[#F0F0FF]/75 text-sm flex gap-2">
                      <span className="text-[#9B5DE5] mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function LandingScreen() {
  const { humanName, botCount, difficulty, setHumanName, setBotCount, setDifficulty, startGame } = useGameStore();
  const [name, setName] = useState(humanName);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  function handleStart() {
    if (!name.trim()) return;
    setHumanName(name.trim());
    startGame();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 gap-8 relative overflow-hidden bg-[#080810]">
      <AnimatePresence>
        {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
      </AnimatePresence>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#9B5DE5]/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-[#00F5FF]/8 blur-3xl" />
      </div>

      {/* How to play button */}
      <button
        className="absolute top-5 right-5 z-10 w-9 h-9 rounded-full bg-[#1A1A2E] border border-[#9B5DE5]/40 flex items-center justify-center text-[#9B5DE5] font-black text-sm hover:border-[#9B5DE5]/80 transition-colors"
        onClick={() => setShowHowToPlay(true)}
      >
        ?
      </button>

      <motion.div
        className="text-center z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-['Space_Grotesk'] text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#9B5DE5] to-[#00F5FF]">
          KAMBIYO
        </h1>
        <p className="text-[#F0F0FF]/50 text-sm mt-1 tracking-widest uppercase">get the lowest score. call it.</p>
      </motion.div>

      <motion.div
        className="w-full max-w-sm flex flex-col gap-6 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <div className="flex flex-col gap-2">
          <label className="text-[#F0F0FF]/60 text-xs uppercase tracking-widest">what's your name?</label>
          <input
            className="bg-[#1A1A2E] border border-[#9B5DE5]/40 rounded-xl px-4 py-3 text-[#F0F0FF] text-lg outline-none focus:border-[#9B5DE5] transition-colors placeholder:text-[#F0F0FF]/20 font-['Inter']"
            placeholder="enter name..."
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            maxLength={20}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[#F0F0FF]/60 text-xs uppercase tracking-widest">opponents</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setBotCount(n)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                  botCount === n
                    ? 'bg-[#9B5DE5] border-[#9B5DE5] text-white'
                    : 'bg-[#1A1A2E] border-[#9B5DE5]/30 text-[#F0F0FF]/60 hover:border-[#9B5DE5]/60'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[#F0F0FF]/60 text-xs uppercase tracking-widest">difficulty</label>
          <div className="flex gap-2">
            {(Object.keys(DIFFICULTY_LABELS) as Array<keyof typeof DIFFICULTY_LABELS>).map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-0.5 ${
                  difficulty === d
                    ? 'bg-[#9B5DE5] border-[#9B5DE5] text-white'
                    : 'bg-[#1A1A2E] border-[#9B5DE5]/30 text-[#F0F0FF]/60 hover:border-[#9B5DE5]/60'
                }`}
              >
                <span>{DIFFICULTY_LABELS[d].label}</span>
                <span className="text-[9px] opacity-70 font-normal">{DIFFICULTY_LABELS[d].desc}</span>
              </button>
            ))}
          </div>
        </div>

        <motion.button
          className={`w-full py-4 rounded-2xl font-['Space_Grotesk'] font-black text-xl tracking-wider transition-all ${
            name.trim()
              ? 'bg-gradient-to-r from-[#9B5DE5] to-[#00F5FF] text-[#080810] shadow-lg shadow-[#9B5DE5]/30'
              : 'bg-[#1A1A2E] text-[#F0F0FF]/20 cursor-not-allowed'
          }`}
          whileTap={name.trim() ? { scale: 0.97 } : undefined}
          onClick={handleStart}
        >
          DEAL ME IN
        </motion.button>
      </motion.div>
    </div>
  );
}
