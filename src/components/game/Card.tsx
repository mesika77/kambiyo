import { AnimatePresence, motion } from 'framer-motion';
import type { Card as CardType } from '../../types/game';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  size?: 'xs' | 'sm' | 'md';
  faceDown?: boolean;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠', joker: '🃏',
};
const SUIT_COLORS: Record<string, string> = {
  hearts: 'text-red-400', diamonds: 'text-red-400',
  clubs: 'text-[#F0F0FF]', spades: 'text-[#F0F0FF]', joker: 'text-yellow-300',
};

function CardFace({ card, size }: { card: CardType; size: 'xs' | 'sm' | 'md' }) {
  const suitColor = SUIT_COLORS[card.suit];
  const symbol = SUIT_SYMBOLS[card.suit];
  if (size === 'xs') {
    return (
      <div className="w-full h-full rounded-lg bg-[#1A1A2E] border border-[#9B5DE5]/40 flex flex-col items-center justify-center select-none p-0.5">
        <div className={`font-bold leading-none ${suitColor} text-[9px]`}>{card.rank}</div>
        <div className={`${suitColor} text-xs leading-none`}>{symbol}</div>
      </div>
    );
  }
  const small = size === 'sm';
  return (
    <div className={`w-full h-full rounded-xl bg-[#1A1A2E] border border-[#9B5DE5]/40 flex flex-col items-center justify-center select-none ${small ? 'p-1' : 'p-2'}`}>
      <div className={`font-bold leading-none ${suitColor} ${small ? 'text-sm' : 'text-xl'}`}>{card.rank}</div>
      <div className={`${suitColor} ${small ? 'text-base' : 'text-2xl'}`}>{symbol}</div>
      <div className={`font-semibold ${suitColor} ${small ? 'text-[10px]' : 'text-xs'} opacity-70`}>{card.value}</div>
    </div>
  );
}

function CardBack({ size }: { size: 'xs' | 'sm' | 'md' }) {
  if (size === 'xs') {
    return (
      <div className="w-full h-full rounded-lg bg-[#1A1A2E] border border-[#9B5DE5]/50 flex items-center justify-center overflow-hidden relative">
        <div className="text-xs opacity-20">🂠</div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#9B5DE5]/10 to-[#00F5FF]/10" />
      </div>
    );
  }
  const small = size === 'sm';
  return (
    <div className="w-full h-full rounded-xl bg-[#1A1A2E] border border-[#9B5DE5]/60 flex items-center justify-center select-none overflow-hidden relative">
      <div className={`${small ? 'text-xl' : 'text-3xl'} opacity-30`}>🂠</div>
      <div className="absolute inset-0 bg-gradient-to-br from-[#9B5DE5]/10 to-[#00F5FF]/10" />
    </div>
  );
}

export function Card({ card, onClick, isSelectable, isSelected, size = 'md', faceDown }: CardProps) {
  const showFront = !faceDown && card.isRevealed;
  const dims = size === 'md' ? 'w-16 h-24' : size === 'sm' ? 'w-10 h-14' : 'w-7 h-10';
  return (
    <motion.div
      className={`relative ${dims} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      animate={isSelected ? { scale: 1.08, y: -4 } : { scale: 1, y: 0 }}
      onClick={onClick}
    >
      {isSelectable && !isSelected && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-[#00F5FF] z-10 pointer-events-none"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        />
      )}
      {isSelected && (
        <div className="absolute inset-0 rounded-xl border-2 border-[#FF006E] z-10 pointer-events-none" />
      )}
      <AnimatePresence mode="wait" initial={false}>
        {showFront ? (
          <motion.div
            key="front"
            className="absolute inset-0"
            initial={{ rotateY: 90, opacity: 0, scale: 0.85 }}
            animate={{ rotateY: 0, opacity: 1, scale: 1 }}
            exit={{ rotateY: -90, opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <CardFace card={card} size={size ?? 'md'} />
          </motion.div>
        ) : (
          <motion.div
            key="back"
            className="absolute inset-0"
            initial={{ rotateY: 90, opacity: 0, scale: 0.85 }}
            animate={{ rotateY: 0, opacity: 1, scale: 1 }}
            exit={{ rotateY: -90, opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <CardBack size={size ?? 'md'} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
