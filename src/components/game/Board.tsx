import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { BotRow } from './BotRow';
import { PlayerHand } from './PlayerHand';
import { DrawPile } from './DrawPile';
import { DiscardPile } from './DiscardPile';
import { PowerModal } from './PowerModal';
import { SlapFX } from '../ui/SlapFX';
import { ToastStack } from '../ui/Toast';
import { CambioButton } from '../ui/CambioButton';

export function Board() {
  const { players, currentPlayerIndex, cambioFXActive, cambioCalledBy } = useGameStore();
  const bots = players.slice(1);

  return (
    <div className="min-h-screen bg-[#080810] flex flex-col relative overflow-hidden select-none">
      <SlapFX />
      <ToastStack />
      <PowerModal />

      <AnimatePresence>
        {cambioFXActive && (
          <motion.div
            key="cambio-fx"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.2 }}
          >
            <div className="absolute inset-0 bg-white/10" />
            <motion.p
              className="font-['Space_Grotesk'] font-black text-5xl text-[#FF006E] drop-shadow-[0_0_24px_#FF006E]"
              initial={{ scale: 0.5 }}
              animate={{ scale: [0.5, 1.2, 1] }}
              transition={{ duration: 0.5 }}
            >
              CAMBIO 🔥
            </motion.p>
            {cambioCalledBy !== null && (
              <p className="text-[#F0F0FF]/70 text-sm mt-2">
                called by {players[cambioCalledBy]?.name}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bots — top */}
      <div className="flex-none overflow-y-auto max-h-[35vh] border-b border-[#9B5DE5]/10 pt-3 pb-2 px-2 flex flex-col gap-1">
        {bots.map((bot, i) => (
          <BotRow key={bot.id} player={bot} playerIndex={i + 1} />
        ))}
      </div>

      {/* Center — piles + Cambio */}
      <div className="flex-none h-[15vh] flex items-center justify-center gap-6 px-4">
        <DrawPile />
        <CambioButton />
        <DiscardPile />
      </div>

      {/* Human hand — bottom */}
      <div className="flex-1 flex flex-col justify-start pt-2 overflow-y-auto">
        <div className="flex items-center gap-2 px-4 pb-1">
          <span className="text-[#F0F0FF]/40 text-xs">{players[0]?.name}</span>
          {currentPlayerIndex === 0 && (
            <motion.span
              className="text-[10px] px-2 py-0.5 rounded-full bg-[#9B5DE5]/20 text-[#9B5DE5] font-bold"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              your turn
            </motion.span>
          )}
        </div>
        <PlayerHand />
      </div>
    </div>
  );
}
