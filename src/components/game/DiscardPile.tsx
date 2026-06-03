import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { Card } from './Card';

export function DiscardPile() {
  const { discardPile, currentPlayerIndex, players, turnPhase, drawFromDiscard } = useGameStore();
  const isHumanTurn = currentPlayerIndex === 0 && !players[0]?.isBot;
  const canDraw = isHumanTurn && turnPhase === 'WAITING_FOR_DRAW';
  const topCard = discardPile[discardPile.length - 1];

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-16 h-24 rounded-xl relative ${canDraw && topCard ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={canDraw && topCard ? drawFromDiscard : undefined}
      >
        {topCard ? (
          <AnimatePresence>
            <motion.div
              key={topCard.id}
              className="absolute inset-0"
              initial={{ scale: 0.5, opacity: 0, y: -48, rotate: -18 }}
              animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 14, transition: { duration: 0.12 } }}
              transition={{ type: 'spring', stiffness: 360, damping: 22 }}
            >
              <Card card={{ ...topCard, isRevealed: true }} size="md" />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="w-full h-full rounded-xl border-2 border-dashed border-[#9B5DE5]/20 flex items-center justify-center">
            <span className="text-[#9B5DE5]/20 text-xs">empty</span>
          </div>
        )}
        {canDraw && topCard && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-[#00F5FF] pointer-events-none"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
        )}
      </div>
      <span className="text-[#F0F0FF]/30 text-[10px] uppercase tracking-wider">discard</span>
    </div>
  );
}
