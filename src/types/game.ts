export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'JOKER';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GamePhase = 'LANDING' | 'SETUP_PEEK' | 'PLAYING' | 'CAMBIO_CALLED' | 'SCORING';
export type TurnPhase = 'WAITING_FOR_DRAW' | 'HOLDING_DRAWN_CARD' | 'POWER_CHOICE' | 'EXECUTING_POWER' | 'END_TURN';
export type PowerType = 'PEEK_OWN' | 'PEEK_OPPONENT' | 'BLIND_SWAP' | 'PEEK_AND_SWAP' | 'DOUBLE_PEEK_SWAP';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
  isRevealed: boolean;
  knownBy: number[];
}

export interface PowerSelection {
  playerIndex: number;
  cardIndex: number;
}

export interface ActivePower {
  type: PowerType;
  cardId: string;
  step: number;
  totalSteps: number;
  selections: PowerSelection[];
  peekingCardId: string | null;
}

export interface BotMemoryEntry {
  value: number;
  learnedAtTurn: number;
}

export interface Player {
  id: number;
  name: string;
  isBot: boolean;
  avatar: string;
  hand: Card[];
  memory: Record<string, BotMemoryEntry>;
}

export interface ToastMessage {
  id: string;
  text: string;
  type: 'info' | 'error' | 'success';
}

export interface GameState {
  phase: GamePhase;
  humanName: string;
  botCount: number;
  difficulty: Difficulty;
  players: Player[];
  currentPlayerIndex: number;
  drawPile: Card[];
  discardPile: Card[];
  drawnCard: Card | null;
  drawnFrom: 'deck' | 'discard' | null;
  turnPhase: TurnPhase;
  activePower: ActivePower | null;
  pendingPowerCard: Card | null;
  setupPeeksRemaining: number;
  cambioCalledBy: number | null;
  finalRoundRemaining: number;
  slapLockUntil: number | null;
  turnNumber: number;
  toasts: ToastMessage[];
  slapFXActive: boolean;
  cambioFXActive: boolean;
  lastSlapValid: boolean | null;
  swapFX: { cardIds: string[] } | null;
}
