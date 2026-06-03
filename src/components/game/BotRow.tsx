import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { Card } from './Card';
import type { Player } from '../../types/game';

interface BotRowProps {
  player: Player;
  playerIndex: number;
}

export function BotRow({ player, playerIndex }: BotRowProps) {
  const { currentPlayerIndex, turnPhase, activePower } = useGameStore();
  const isActive = currentPlayerIndex === playerIndex;
  const isThinking = isActive && (turnPhase === 'WAITING_FOR_DRAW' || turnPhase === 'HOLDING_DRAWN_CARD');

  function handleCardClick(cardIndex: number) {
    const s = useGameStore.getState();
    if (!s.activePower) return;
    s.selectCardForPower(playerIndex, cardIndex);
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-2xl transition-all ${isActive ? 'bg-[#9B5DE5]/10 border border-[#9B5DE5]/30' : 'border border-transparent'}`}>
      <div className="flex flex-col items-center gap-0.5 w-10 shrink-0">
        <div className="relative">
          <span className="text-2xl">{player.avatar}</span>
          {isThinking && (
            <motion.div
              className="absolute -inset-1 rounded-full border-2 border-[#9B5DE5]"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.95, 1.05, 0.95] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          )}
        </div>
        <span className="text-[9px] text-[#F0F0FF]/60 truncate max-w-[40px] text-center leading-tight">{player.name}</span>
      </div>

      <div className="flex gap-1.5">
        {player.hand.map((card, ci) => {
          const isSelectable = !!activePower && playerIndex !== 0 && (
            (activePower.type === 'PEEK_OPPONENT' && activePower.step === 1) ||
            (activePower.type === 'BLIND_SWAP' && activePower.step === 2) ||
            // Q: step 1 = peek any (opponents ok), step 3 = pick opponent to swap with
            (activePower.type === 'PEEK_AND_SWAP' && (activePower.step === 1 || activePower.step === 3)) ||
            // Black K: steps 1-2 = peek any (opponents ok), step 4 = pick opponent to swap with
            (activePower.type === 'DOUBLE_PEEK_SWAP' && (activePower.step === 1 || activePower.step === 2 || activePower.step === 4))
          );
          return (
            <Card
              key={card.id}
              card={card}
              size="sm"
              isSelectable={isSelectable}
              onClick={isSelectable ? () => handleCardClick(ci) : undefined}
            />
          );
        })}
      </div>

      {player.hand.length < 4 && (
        <span className="text-[10px] text-[#00F5FF]/60 ml-auto">{player.hand.length} left</span>
      )}
    </div>
  );
}
