import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import type { Player, Difficulty } from '../types/game';
import {
  BOT_TURN_DELAYS, BOT_CAMBIO_THRESHOLDS, BOT_MEMORY_FORGET_TURNS,
  INITIAL_HAND_SIZE,
} from '../lib/constants';
import { isPowerCard } from '../lib/deck';

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isCardKnown(player: Player, cardId: string, currentTurn: number, difficulty: Difficulty): boolean {
  const entry = player.memory[cardId];
  if (!entry) return false;
  if (difficulty === 'hard') return true;
  const forgetTurns = BOT_MEMORY_FORGET_TURNS[difficulty];
  if (currentTurn - entry.learnedAtTurn > forgetTurns) return false;
  if (difficulty === 'easy') {
    const turns = currentTurn - entry.learnedAtTurn;
    return Math.random() < Math.pow(0.6, turns);
  }
  return true;
}

function estimateScore(player: Player, currentTurn: number, difficulty: Difficulty): number {
  let score = 0;
  for (const card of player.hand) {
    if (isCardKnown(player, card.id, currentTurn, difficulty)) {
      score += card.value;
    } else {
      score += 5.5;
    }
  }
  return score;
}

function getWorstKnownIndex(player: Player, currentTurn: number, difficulty: Difficulty): number {
  let worst = -1;
  let worstVal = -Infinity;
  for (let i = 0; i < player.hand.length; i++) {
    const card = player.hand[i];
    if (isCardKnown(player, card.id, currentTurn, difficulty) && card.value > worstVal) {
      worst = i;
      worstVal = card.value;
    }
  }
  return worst;
}

function executeBotPower(botIndex: number, difficulty: Difficulty) {
  const s = useGameStore.getState();
  if (s.turnPhase !== 'EXECUTING_POWER' || !s.activePower) return;
  const bot = s.players[botIndex];
  const { type } = s.activePower;

  if (type === 'PEEK_OWN') {
    const unknownIdx = bot.hand.findIndex((c) => !bot.memory[c.id]);
    s.selectCardForPower(botIndex, unknownIdx >= 0 ? unknownIdx : 0);
    return;
  }

  if (type === 'PEEK_OPPONENT') {
    let targetPlayer = -1;
    let targetCard = -1;
    for (let pi = 0; pi < s.players.length; pi++) {
      if (pi === botIndex) continue;
      for (let ci = 0; ci < s.players[pi].hand.length; ci++) {
        const card = s.players[pi].hand[ci];
        if (!bot.memory[card.id]) { targetPlayer = pi; targetCard = ci; break; }
      }
      if (targetPlayer >= 0) break;
    }
    if (targetPlayer < 0) { s.skipPower(); return; }
    s.selectCardForPower(targetPlayer, targetCard);
    return;
  }

  if (type === 'BLIND_SWAP') {
    const worstOwn = bot.hand.reduce(
      (best, c, i) => c.value > best.value ? { value: c.value, idx: i } : best,
      { value: -Infinity, idx: 0 }
    );
    s.selectCardForPower(botIndex, worstOwn.idx);
    setTimeout(() => {
      const s2 = useGameStore.getState();
      let targetPi = -1;
      for (let pi = 0; pi < s2.players.length; pi++) {
        if (pi === botIndex) continue;
        targetPi = pi; break;
      }
      if (targetPi < 0) { s2.skipPowerSwap(); return; }
      let targetCi = 0;
      if (difficulty === 'hard') {
        let bestVal = Infinity;
        const targetBot = s2.players[botIndex];
        s2.players[targetPi].hand.forEach((c, i) => {
          if (targetBot.memory[c.id] && targetBot.memory[c.id].value < bestVal) {
            bestVal = targetBot.memory[c.id].value;
            targetCi = i;
          }
        });
      } else {
        targetCi = Math.floor(Math.random() * s2.players[targetPi].hand.length);
      }
      s2.selectCardForPower(targetPi, targetCi);
    }, rand(300, 600));
    return;
  }

  // PEEK_AND_SWAP and DOUBLE_PEEK_SWAP: peek first, then skip swap
  if (type === 'PEEK_AND_SWAP' || type === 'DOUBLE_PEEK_SWAP') {
    const unknownIdx = bot.hand.findIndex((c) => !bot.memory[c.id]);
    s.selectCardForPower(botIndex, unknownIdx >= 0 ? unknownIdx : 0);
    setTimeout(() => {
      const s2 = useGameStore.getState();
      if (s2.activePower && s2.activePower.step > 1) {
        if (type === 'DOUBLE_PEEK_SWAP' && s2.activePower.step === 2) {
          // Peek a second card
          const unknownIdx2 = bot.hand.findIndex((c, i) => !bot.memory[c.id] && i !== unknownIdx);
          s2.selectCardForPower(botIndex, unknownIdx2 >= 0 ? unknownIdx2 : (unknownIdx + 1) % bot.hand.length);
          setTimeout(() => {
            const s3 = useGameStore.getState();
            if (s3.activePower) s3.skipPowerSwap();
          }, 2500);
        } else {
          s2.skipPowerSwap();
        }
      }
    }, 2500);
  }
}

export function useBotAI() {
  const { phase, turnPhase, currentPlayerIndex, players, difficulty, turnNumber, discardPile } = useGameStore();

  useEffect(() => {
    if (phase !== 'PLAYING' && phase !== 'CAMBIO_CALLED') return;
    if (turnPhase !== 'WAITING_FOR_DRAW') return;

    const player = players[currentPlayerIndex];
    if (!player?.isBot) return;

    const delays = BOT_TURN_DELAYS[difficulty];
    const delay = rand(delays.min, delays.max);

    const timer = setTimeout(() => {
      const s = useGameStore.getState();
      if (s.currentPlayerIndex !== currentPlayerIndex) return;
      if (s.turnPhase !== 'WAITING_FOR_DRAW') return;

      const bot = s.players[currentPlayerIndex];
      if (!bot?.isBot) return;

      const threshold = BOT_CAMBIO_THRESHOLDS[difficulty];
      const estimated = estimateScore(bot, s.turnNumber, difficulty);

      if (estimated <= threshold && s.phase === 'PLAYING') {
        s.callCambio(currentPlayerIndex);
        return;
      }

      const topDiscard = s.discardPile[s.discardPile.length - 1];
      const worstIdx = getWorstKnownIndex(bot, s.turnNumber, difficulty);
      const worstVal = worstIdx >= 0 ? bot.hand[worstIdx].value : 8;

      if (topDiscard && topDiscard.value < worstVal - 2 && Math.random() > 0.2) {
        s.drawFromDiscard();
        setTimeout(() => {
          const s2 = useGameStore.getState();
          if (!s2.drawnCard || s2.currentPlayerIndex !== currentPlayerIndex) return;
          const swapIdx = worstIdx >= 0 ? worstIdx : Math.floor(Math.random() * INITIAL_HAND_SIZE);
          s2.swapDrawnCard(swapIdx);
        }, rand(200, 600));
      } else {
        s.drawFromDeck();
        setTimeout(() => {
          const s2 = useGameStore.getState();
          if (!s2.drawnCard || s2.currentPlayerIndex !== currentPlayerIndex) return;
          const bot2 = s2.players[currentPlayerIndex];
          const drawn = s2.drawnCard;
          const worst = getWorstKnownIndex(bot2, s2.turnNumber, difficulty);
          const worstCard = worst >= 0 ? bot2.hand[worst] : null;

          if (isPowerCard(drawn.rank)) {
            s2.discardDrawnCard();
            setTimeout(() => {
              const s3 = useGameStore.getState();
              if (s3.turnPhase !== 'POWER_CHOICE') return;
              const usePower = difficulty === 'easy' ? Math.random() > 0.5 : true;
              if (usePower) {
                s3.activatePower();
                setTimeout(() => executeBotPower(currentPlayerIndex, difficulty), rand(400, 800));
              } else {
                s3.skipPower();
              }
            }, rand(300, 600));
          } else if (worstCard && drawn.value < worstCard.value) {
            s2.swapDrawnCard(worst);
          } else if (drawn.value <= 3) {
            const unknownIdx = bot2.hand.findIndex((c) => !isCardKnown(bot2, c.id, s2.turnNumber, difficulty));
            if (unknownIdx >= 0) s2.swapDrawnCard(unknownIdx);
            else s2.discardDrawnCard();
          } else {
            s2.discardDrawnCard();
          }
        }, rand(300, 700));
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [phase, turnPhase, currentPlayerIndex]);
}
