import { describe, it, expect } from 'vitest';
import { calcFinalScores } from './scoring';
import type { Player } from '../types/game';

function makePlayer(id: number, values: number[], isBot = false): Player {
  return {
    id, name: `P${id}`, isBot, avatar: '🎭',
    hand: values.map((v, i) => ({
      id: `card-${id}-${i}`, suit: 'spades', rank: '2', value: v,
      isRevealed: false, knownBy: [],
    })),
    memory: {},
  };
}

describe('calcFinalScores', () => {
  it('sorts ascending by final score', () => {
    const players = [makePlayer(0, [5,5,5,5]), makePlayer(1, [1,1,1,1])];
    const results = calcFinalScores(players, null);
    expect(results[0].finalScore).toBe(4);
    expect(results[1].finalScore).toBe(20);
  });

  it('no penalty when caller has lowest score', () => {
    const players = [makePlayer(0, [1,1,1,1]), makePlayer(1, [5,5,5,5])];
    const results = calcFinalScores(players, 0);
    const caller = results.find(r => r.playerIndex === 0)!;
    expect(caller.hasPenalty).toBe(false);
    expect(caller.finalScore).toBe(4);
  });

  it('adds +5 penalty when caller does NOT have lowest score', () => {
    const players = [makePlayer(0, [5,5,5,5]), makePlayer(1, [1,1,1,1])];
    const results = calcFinalScores(players, 0);
    const caller = results.find(r => r.playerIndex === 0)!;
    expect(caller.hasPenalty).toBe(true);
    expect(caller.finalScore).toBe(25);
  });

  it('tie: no penalty for caller when tied for lowest', () => {
    const players = [makePlayer(0, [2,2,2,2]), makePlayer(1, [2,2,2,2])];
    const results = calcFinalScores(players, 0);
    const caller = results.find(r => r.playerIndex === 0)!;
    expect(caller.hasPenalty).toBe(false);
  });
});
