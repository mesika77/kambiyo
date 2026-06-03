import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';

export function CambioButton() {
  const { phase, turnPhase, currentPlayerIndex, players, callCambio } = useGameStore();
  const isHumanTurn = currentPlayerIndex === 0 && !players[0]?.isBot;
  const canCall = isHumanTurn && turnPhase === 'WAITING_FOR_DRAW' && phase === 'PLAYING';
  if (!canCall) return null;
  return (
    <motion.button
      className="px-5 py-2 rounded-xl font-['Space_Grotesk'] font-black text-sm tracking-widest bg-gradient-to-r from-[#FF006E] to-[#9B5DE5] text-white shadow-lg shadow-[#FF006E]/30"
      whileTap={{ scale: 0.93 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => callCambio()}
    >
      CAMBIO
    </motion.button>
  );
}
