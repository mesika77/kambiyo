import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { Card } from './Card';

export function PlayerHand() {
  const {
    players, currentPlayerIndex, turnPhase, activePower, drawnCard, drawnFrom,
    setupPeeksRemaining, phase, swapDrawnCard, discardDrawnCard, attemptSlap,
    setupPeek, selectCardForPower, skipPowerSwap, swapFX,
  } = useGameStore();

  const human = players[0];
  if (!human) return null;

  const isMyTurn = currentPlayerIndex === 0;
  const isSetupPeek = phase === 'SETUP_PEEK';
  const canSlap = (phase === 'PLAYING' || phase === 'CAMBIO_CALLED') && !isMyTurn;

  function handleCardClick(cardIndex: number) {
    if (isSetupPeek) { setupPeek(cardIndex); return; }

    if (activePower) {
      const ap = activePower;
      const needsOwnCard =
        (ap.type === 'PEEK_OWN' && ap.step === 1) ||
        (ap.type === 'BLIND_SWAP' && ap.step === 1) ||
        // Q: step 1 = peek any (own cards allowed), step 2 = pick own card to swap
        (ap.type === 'PEEK_AND_SWAP' && (ap.step === 1 || ap.step === 2)) ||
        // Black K: steps 1-2 = peek any (own cards allowed), step 3 = pick own card to swap
        (ap.type === 'DOUBLE_PEEK_SWAP' && (ap.step === 1 || ap.step === 2 || ap.step === 3));
      if (needsOwnCard) { selectCardForPower(0, cardIndex); return; }
    }

    if (drawnCard && isMyTurn && turnPhase === 'HOLDING_DRAWN_CARD') {
      swapDrawnCard(cardIndex);
      return;
    }

    if (canSlap) { attemptSlap(0, cardIndex); }
  }

  function getCardSelectable(cardIndex: number): boolean {
    if (isSetupPeek) return cardIndex >= 2 && !human.hand[cardIndex].knownBy.includes(0) && setupPeeksRemaining > 0;
    if (activePower) {
      const ap = activePower;
      return (
        (ap.type === 'PEEK_OWN' && ap.step === 1) ||
        (ap.type === 'BLIND_SWAP' && ap.step === 1) ||
        (ap.type === 'PEEK_AND_SWAP' && (ap.step === 1 || ap.step === 2)) ||
        (ap.type === 'DOUBLE_PEEK_SWAP' && (ap.step === 1 || ap.step === 2 || ap.step === 3))
      );
    }
    if (drawnCard && isMyTurn && turnPhase === 'HOLDING_DRAWN_CARD') return true;
    if (canSlap) return true;
    return false;
  }

  return (
    <div className="flex flex-col items-center gap-3 px-4 pb-4 pt-2">
      <AnimatePresence>
        {isSetupPeek && (
          <motion.p
            className="text-[#00F5FF] text-xs font-semibold tracking-wide text-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            tap {setupPeeksRemaining} card{setupPeeksRemaining !== 1 ? 's' : ''} to peek
          </motion.p>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-3">
        {human.hand.map((card, ci) => (
          <div key={card.id} className="relative">
            <Card
              card={card}
              size="md"
              isSelectable={getCardSelectable(ci)}
              isSwapped={swapFX?.cardIds.includes(card.id)}
              onClick={() => handleCardClick(ci)}
            />
            {isSetupPeek && ci < 2 && (
              <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center pointer-events-none">
                <span className="text-white/40 text-lg">🔒</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {drawnCard && isMyTurn && turnPhase === 'HOLDING_DRAWN_CARD' && (
          <motion.div
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 32, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          >
            <p className="text-[#F0F0FF]/50 text-xs">drawn card — swap with a card above or discard</p>
            <div className="flex items-center gap-4">
              <Card card={drawnCard} size="md" />
              {drawnFrom === 'deck' && (
                <motion.button
                  className="px-4 py-2 rounded-xl bg-[#FF006E]/20 border border-[#FF006E]/40 text-[#FF006E] text-sm font-bold"
                  whileTap={{ scale: 0.95 }}
                  onClick={discardDrawnCard}
                >
                  discard
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activePower && (activePower.type === 'PEEK_AND_SWAP' || activePower.type === 'DOUBLE_PEEK_SWAP') && activePower.step >= 2 && currentPlayerIndex === 0 && (
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-4 py-2 rounded-xl bg-[#1A1A2E] border border-[#9B5DE5]/30 text-[#F0F0FF]/60 text-sm"
            onClick={skipPowerSwap}
          >
            skip swap
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
