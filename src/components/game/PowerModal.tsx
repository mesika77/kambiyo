import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { Card } from './Card';

const POWER_PROMPTS: Record<string, string[]> = {
  PEEK_OWN: ['select one of your face-down cards to peek'],
  PEEK_OPPONENT: ["select an opponent's face-down card to peek"],
  BLIND_SWAP: ['select your card to swap', "select opponent's card to swap with"],
  PEEK_AND_SWAP: ['select any card to peek', 'select your card to swap (or skip)', "select opponent's card"],
  DOUBLE_PEEK_SWAP: ['select any card to peek', 'select a second card to peek', 'select your card to swap (or skip)', "select opponent's card"],
};

export function PowerModal() {
  const { turnPhase, pendingPowerCard, activePower, activatePower, skipPower, currentPlayerIndex, players } = useGameStore();
  const isHumanTurn = currentPlayerIndex === 0 && !players[0]?.isBot;

  return (
    <AnimatePresence>
      {turnPhase === 'POWER_CHOICE' && pendingPowerCard && isHumanTurn && (
        <motion.div
          className="fixed inset-0 z-30 flex items-end justify-center pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            className="relative z-10 bg-[#1A1A2E] border border-[#9B5DE5]/40 rounded-3xl p-5 mx-4 w-full max-w-sm flex flex-col items-center gap-4"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <p className="text-[#F0F0FF]/50 text-xs uppercase tracking-widest">power card</p>
            <Card card={{ ...pendingPowerCard, isRevealed: true }} size="md" />
            <p className="text-[#F0F0FF] text-sm font-semibold text-center">use this card's power?</p>
            <div className="flex gap-3 w-full">
              <button
                className="flex-1 py-3 rounded-xl bg-[#9B5DE5] text-white font-bold text-sm"
                onClick={activatePower}
              >
                Use Power
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-[#1A1A2E] border border-[#9B5DE5]/30 text-[#F0F0FF]/60 font-bold text-sm"
                onClick={skipPower}
              >
                Discard Only
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {turnPhase === 'EXECUTING_POWER' && activePower && isHumanTurn && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-30 flex justify-center pt-4 pointer-events-none"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
        >
          <div className="pointer-events-auto bg-[#1A1A2E]/90 border border-[#00F5FF]/40 rounded-2xl px-5 py-3 mx-4 backdrop-blur-sm">
            <p className="text-[#00F5FF] text-sm font-semibold text-center">
              {POWER_PROMPTS[activePower.type]?.[activePower.step - 1] ?? 'select a card'}
            </p>
            <p className="text-[#F0F0FF]/30 text-xs text-center mt-0.5">
              step {activePower.step} of {activePower.totalSteps}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
