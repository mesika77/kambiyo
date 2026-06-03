import type { Card, Rank, Suit } from '../types/game';
import { CARD_RANK_VALUES, POWER_RANKS } from './constants';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

export function getCardValue(rank: Rank, suit: Suit): number {
  if (rank === 'JOKER') return 0;
  if (rank === 'K') return (suit === 'hearts' || suit === 'diamonds') ? -1 : 13;
  return CARD_RANK_VALUES[rank];
}

export function createDeck(): Card[] {
  const cards: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({ id: `${suit}-${rank}`, suit, rank, value: getCardValue(rank, suit), isRevealed: false, knownBy: [] });
    }
  }
  cards.push({ id: 'joker-1', suit: 'joker', rank: 'JOKER', value: 0, isRevealed: false, knownBy: [] });
  cards.push({ id: 'joker-2', suit: 'joker', rank: 'JOKER', value: 0, isRevealed: false, knownBy: [] });
  return cards;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function isPowerCard(rank: Rank): boolean {
  return POWER_RANKS.has(rank);
}

export function reshuffleDiscard(discardPile: Card[]): { newDrawPile: Card[]; newDiscardPile: Card[] } {
  if (discardPile.length <= 1) return { newDrawPile: [], newDiscardPile: discardPile };
  const top = discardPile[discardPile.length - 1];
  const toShuffle = discardPile.slice(0, -1).map(c => ({ ...c, isRevealed: false, knownBy: [] }));
  return { newDrawPile: shuffle(toShuffle), newDiscardPile: [top] };
}
