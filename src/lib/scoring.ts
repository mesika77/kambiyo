import type { Player } from '../types/game';
import { CAMBIO_PENALTY } from './constants';

export interface ScoreResult {
  playerIndex: number;
  name: string;
  avatar: string;
  score: number;
  hasPenalty: boolean;
  finalScore: number;
}

export function calcPlayerScore(player: Player): number {
  return player.hand.reduce((sum, card) => sum + card.value, 0);
}

export function calcFinalScores(players: Player[], cambioCalledBy: number | null): ScoreResult[] {
  const results: ScoreResult[] = players.map((p, i) => {
    const score = calcPlayerScore(p);
    return { playerIndex: i, name: p.name, avatar: p.avatar, score, hasPenalty: false, finalScore: score };
  });

  if (cambioCalledBy !== null) {
    const minScore = Math.min(...results.map(r => r.score));
    const callerResult = results[cambioCalledBy];
    if (callerResult.score > minScore) {
      callerResult.hasPenalty = true;
      callerResult.finalScore = callerResult.score + CAMBIO_PENALTY;
    }
  }

  return results.sort((a, b) => a.finalScore - b.finalScore);
}
