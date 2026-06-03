import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';

const DIFFICULTY_LABELS = {
  easy: { label: 'EASY', desc: 'forgetful & slow' },
  medium: { label: 'MEDIUM', desc: 'casual player' },
  hard: { label: 'HARD', desc: 'perfect memory' },
} as const;

export function LandingScreen() {
  const { humanName, botCount, difficulty, setHumanName, setBotCount, setDifficulty, startGame } = useGameStore();
  const [name, setName] = useState(humanName);

  function handleStart() {
    if (!name.trim()) return;
    setHumanName(name.trim());
    startGame();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 gap-8 relative overflow-hidden bg-[#080810]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#9B5DE5]/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-[#00F5FF]/8 blur-3xl" />
      </div>

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
