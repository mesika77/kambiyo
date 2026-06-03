import type { Difficulty } from '../types/game';

export const CARD_RANK_VALUES: Record<string, number> = {
  A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, '10': 10,
  J: 11, Q: 12, JOKER: 0,
  // K: red = -1, black = 13 — computed in deck.ts
};

export const POWER_RANKS = new Set(['7', '8', '9', '10', 'J', 'Q', 'K']);

export const HUMAN_GRACE_WINDOW_MS = 600;
export const SETUP_PEEK_DURATION_MS = 3000;
export const POWER_PEEK_DURATION_MS = 2000;
export const INITIAL_HAND_SIZE = 4;
export const CAMBIO_PENALTY = 5;

export const BOT_TURN_DELAYS: Record<Difficulty, { min: number; max: number }> = {
  easy:   { min: 2000, max: 4000 },
  medium: { min: 1000, max: 2000 },
  hard:   { min: 300,  max: 800  },
};

export const BOT_SLAP_CONFIG: Record<Difficulty, { min: number; max: number; chance: number }> = {
  easy:   { min: 3000, max: 6000, chance: 0.30 },
  medium: { min: 1500, max: 3000, chance: 0.55 },
  hard:   { min: 800,  max: 1400, chance: 0.85 },
};

export const BOT_CAMBIO_THRESHOLDS: Record<Difficulty, number> = {
  easy: 10, medium: 6, hard: 4,
};

export const BOT_MEMORY_FORGET_TURNS: Record<Difficulty, number> = {
  easy: 3, medium: 8, hard: Infinity,
};

export const EMOJI_AVATARS = ['🦊','🐺','🐸','👾','🤖','💀','🎭','🦋','🔥','⚡','🌙','🎪','🦄','🐙','👻'];

export const BOT_NAME_PREFIXES = ['itz_', 'xX', 'ok_', 'ur_', 'not_', 'lil', 'main_', 'the_'];
export const BOT_NAME_CORES   = ['vibe', 'slay', 'chaos', 'ghost', 'rizz', 'drip', 'snack', 'shade', 'flex', 'era'];
export const BOT_NAME_SUFFIXES = ['99', '2k', 'xx', 'irl', '_', '4real', 'btw'];
