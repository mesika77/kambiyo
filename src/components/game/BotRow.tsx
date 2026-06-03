import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { Card } from './Card';
import type { Player } from '../../types/game';

interface BotRowProps {
  player: Player;
  playerIndex: number;
  botCount: number;
}

export function BotRow({ player, playerIndex, botCount }: BotRowProps) {
  const { currentPlayerIndex, turnPhase, activePower } = useGameStore();
  const isActive = currentPlayerIndex === playerIndex;
  const isThinking = isActive && (turnPhase === 'WAITING_FOR_DRAW' || turnPhase === 'HOLDING_DRAWN_CARD');

  // Shrink cards as more bots are added so everyone fits in one horizontal row
  const cardSize = botCount <= 2 ? 'sm' : 'xs';
  const avatarSize = botCount <= 3 ? 'text-2xl' : 'text-lg';

  function handleCardClick(cardIndex: number) {
    const s = useGameStore.getState();
    if (!s.activePower) return;
    s.selectCardForPower(playerIndex, cardIndex);
  }

  return (
    <motion.div
      className={`flex flex-col items-center gap-1 px-1.5 py-2 rounded-2xl transition-all flex-1 min-w-0 ${
        isActive
          ? 'bg-[#9B5DE5]/15 ring-1 ring-[#9B5DE5]/40'
          : 'bg-[#0F0F1A]/60'
      }`}
      layout
    >
      {/* Avatar with thinking ring */}
      <div className="relative flex items-center justify-center">
        <span className={avatarSize}>{player.avatar}</span>
        {isThinking && (
          <motion.div
            className="absolute -inset-1 rounded-full border-2 border-[#9B5DE5]"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.95, 1.05, 0.95] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        )}
      </div>

      {/* Name */}
      <span className="text-[8px] text-[#F0F0FF]/50 truncate w-full text-center leading-tight px-1">
        {player.name}
      </span>

      {/* Cards — 2×2 grid */}
      <div className="grid grid-cols-2 gap-0.5">
        {player.hand.map((card, ci) => {
          const isSelectable = !!activePower && playerIndex !== 0 && (
            (activePower.type === 'PEEK_OPPONENT' && activePower.step === 1) ||
            (activePower.type === 'BLIND_SWAP' && activePower.step === 2) ||
            (activePower.type === 'PEEK_AND_SWAP' && (activePower.step === 1 || activePower.step === 3)) ||
            (activePower.type === 'DOUBLE_PEEK_SWAP' && (activePower.step === 1 || activePower.step === 2 || activePower.step === 4))
          );
          return (
            <Card
              key={card.id}
              card={card}
              size={cardSize}
              isSelectable={isSelectable}
              onClick={isSelectable ? () => handleCardClick(ci) : undefined}
            />
          );
        })}
      </div>

      {/* Show card count if some were slapped away */}
      {player.hand.length < 4 && player.hand.length > 0 && (
        <span className="text-[8px] text-[#00F5FF]/60 font-bold">{player.hand.length}</span>
      )}
    </motion.div>
  );
}
