import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';

export function DrawPile() {
  const { drawPile, currentPlayerIndex, players, turnPhase, drawFromDeck } = useGameStore();
  const isHumanTurn = currentPlayerIndex === 0 && !players[0]?.isBot;
  const canDraw = isHumanTurn && turnPhase === 'WAITING_FOR_DRAW';

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        className={`w-14 h-20 rounded-xl bg-[#1A1A2E] border flex items-center justify-center relative overflow-hidden ${canDraw ? 'cursor-pointer border-[#9B5DE5]/50' : 'cursor-default border-[#9B5DE5]/20'}`}
        whileTap={canDraw ? { scale: 0.95 } : undefined}
        onClick={canDraw ? drawFromDeck : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#9B5DE5]/10 to-[#00F5FF]/10" />
        <span className="text-2xl opacity-20">🂠</span>
        {drawPile.length > 0 && (
          <span className="absolute bottom-1 right-1 text-[10px] text-[#9B5DE5]/70 font-bold">{drawPile.length}</span>
        )}
        {/* Pulsing border overlay — same style as selectable cards */}
        {canDraw && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-[#9B5DE5] pointer-events-none"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
          />
        )}
      </motion.div>
      <span className="text-[#F0F0FF]/30 text-[10px] uppercase tracking-wider">deck</span>
    </div>
  );
}
