import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { BOT_SLAP_CONFIG, HUMAN_GRACE_WINDOW_MS } from '../lib/constants';

export function useSlap() {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { discardPile, players, difficulty, phase } = useGameStore();

  const topDiscardId = discardPile[discardPile.length - 1]?.id;

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (phase !== 'PLAYING' && phase !== 'CAMBIO_CALLED') return;
    if (!topDiscardId) return;

    const config = BOT_SLAP_CONFIG[difficulty];

    players.forEach((player, pi) => {
      if (!player.isBot) return;

      if (Math.random() > config.chance) return;

      const delay = HUMAN_GRACE_WINDOW_MS + config.min + Math.random() * (config.max - config.min);

      const t = setTimeout(() => {
        const s = useGameStore.getState();
        const currentTop = s.discardPile[s.discardPile.length - 1];
        if (!currentTop || currentTop.id !== topDiscardId) return;

        const matchIdx = s.players[pi].hand.findIndex(c => c.rank === currentTop.rank);
        if (matchIdx < 0) return;

        const bot = s.players[pi];
        const card = bot.hand[matchIdx];
        const known = difficulty === 'hard' || !!bot.memory[card.id];
        if (!known && difficulty !== 'easy') return;
        if (difficulty === 'easy' && Math.random() > 0.5) return;

        s.attemptSlap(pi, matchIdx);
      }, delay);

      timersRef.current.push(t);
    });

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [topDiscardId, phase]);
}
