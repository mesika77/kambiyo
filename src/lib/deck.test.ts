import { describe, it, expect } from 'vitest';
import { createDeck, shuffle, getCardValue, isPowerCard, reshuffleDiscard } from './deck';

describe('createDeck', () => {
  it('creates 54 cards', () => {
    expect(createDeck()).toHaveLength(54);
  });

  it('has 4 suits × 13 ranks + 2 jokers', () => {
    const deck = createDeck();
    const jokers = deck.filter(c => c.suit === 'joker');
    expect(jokers).toHaveLength(2);
    expect(deck.filter(c => c.suit !== 'joker')).toHaveLength(52);
  });

  it('all cards have unique ids', () => {
    const ids = createDeck().map(c => c.id);
    expect(new Set(ids).size).toBe(54);
  });
});

describe('getCardValue', () => {
  it('ace = 1', () => expect(getCardValue('A', 'spades')).toBe(1));
  it('2–6 = face value', () => {
    for (let n = 2; n <= 6; n++) expect(getCardValue(String(n) as any, 'clubs')).toBe(n);
  });
  it('red king = -1', () => {
    expect(getCardValue('K', 'hearts')).toBe(-1);
    expect(getCardValue('K', 'diamonds')).toBe(-1);
  });
  it('black king = 13', () => {
    expect(getCardValue('K', 'spades')).toBe(13);
    expect(getCardValue('K', 'clubs')).toBe(13);
  });
  it('joker = 0', () => expect(getCardValue('JOKER', 'joker')).toBe(0));
  it('jack = 11, queen = 12', () => {
    expect(getCardValue('J', 'hearts')).toBe(11);
    expect(getCardValue('Q', 'hearts')).toBe(12);
  });
});

describe('shuffle', () => {
  it('returns same length array', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffle(arr)).toHaveLength(5);
  });

  it('does not mutate original', () => {
    const arr = [1, 2, 3];
    shuffle(arr);
    expect(arr).toEqual([1, 2, 3]);
  });
});

describe('isPowerCard', () => {
  it('identifies power cards', () => {
    ['7','8','9','10','J','Q','K'].forEach(r => expect(isPowerCard(r as any)).toBe(true));
  });
  it('non-power cards return false', () => {
    ['A','2','3','4','5','6','JOKER'].forEach(r => expect(isPowerCard(r as any)).toBe(false));
  });
});

describe('reshuffleDiscard', () => {
  it('returns empty draw pile if discard has 1 or fewer cards', () => {
    const deck = createDeck();
    const result = reshuffleDiscard([deck[0]]);
    expect(result.newDrawPile).toHaveLength(0);
    expect(result.newDiscardPile).toHaveLength(1);
  });

  it('keeps top discard card in new discard pile', () => {
    const deck = createDeck();
    const top = deck[0];
    const result = reshuffleDiscard([deck[1], deck[2], top]);
    expect(result.newDiscardPile).toHaveLength(1);
    expect(result.newDiscardPile[0].id).toBe(top.id);
  });

  it('shuffles all other cards into new draw pile', () => {
    const deck = createDeck();
    const discard = [deck[0], deck[1], deck[2]]; // top = deck[2]
    const result = reshuffleDiscard(discard);
    expect(result.newDrawPile).toHaveLength(2);
  });

  it('resets isRevealed and knownBy on reshuffled cards', () => {
    const deck = createDeck();
    const revealedCards = deck.slice(0, 3).map(c => ({ ...c, isRevealed: true, knownBy: [0, 1] }));
    const result = reshuffleDiscard(revealedCards);
    result.newDrawPile.forEach(c => {
      expect(c.isRevealed).toBe(false);
      expect(c.knownBy).toHaveLength(0);
    });
  });
});
