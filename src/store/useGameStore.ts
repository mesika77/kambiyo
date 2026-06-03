import { create } from 'zustand';
import type { GameState, Player, ActivePower, PowerType, Difficulty, Card } from '../types/game';
import { createDeck, shuffle, isPowerCard, reshuffleDiscard } from '../lib/deck';
import { generateBotName, generateBotAvatar } from '../lib/botNames';
import { INITIAL_HAND_SIZE, HUMAN_GRACE_WINDOW_MS } from '../lib/constants';

/** Red Kings (hearts/diamonds) have no power — only Black Kings do */
function isActionablePowerCard(card: Card): boolean {
  return isPowerCard(card.rank) &&
    !(card.rank === 'K' && (card.suit === 'hearts' || card.suit === 'diamonds'));
}

const INITIAL_STATE: Omit<GameState, 'humanName' | 'botCount' | 'difficulty'> = {
  phase: 'LANDING',
  players: [],
  currentPlayerIndex: 0,
  drawPile: [],
  discardPile: [],
  drawnCard: null,
  drawnFrom: null,
  turnPhase: 'WAITING_FOR_DRAW',
  activePower: null,
  pendingPowerCard: null,
  setupPeeksRemaining: 2,
  cambioCalledBy: null,
  finalRoundRemaining: 0,
  slapLockUntil: null,
  turnNumber: 0,
  toasts: [],
  slapFXActive: false,
  cambioFXActive: false,
  lastSlapValid: null,
};

interface GameActions {
  setHumanName: (name: string) => void;
  setBotCount: (count: number) => void;
  setDifficulty: (d: Difficulty) => void;
  startGame: () => void;
  setupPeek: (cardIndex: number) => void;
  drawFromDeck: () => void;
  drawFromDiscard: () => void;
  swapDrawnCard: (handIndex: number) => void;
  discardDrawnCard: () => void;
  activatePower: () => void;
  skipPower: () => void;
  selectCardForPower: (playerIndex: number, cardIndex: number) => void;
  skipPowerSwap: () => void;
  attemptSlap: (playerIndex: number, cardIndex: number) => void;
  callCambio: (playerIndex?: number) => void;
  advanceFinalRound: () => void;
  addToast: (text: string, type: 'info' | 'error' | 'success') => void;
  clearToast: (id: string) => void;
  setSlapFX: (active: boolean) => void;
  setCambioFX: (active: boolean) => void;
  resetGame: () => void;
  updateBotMemory: (playerIndex: number, cardId: string, value: number) => void;
  botEndTurn: () => void;
}

// Module-level cooldown to prevent rapid-fire penalty accumulation from accidental double-taps
let humanSlapCooldownUntil = 0;

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...INITIAL_STATE,
  humanName: '',
  botCount: 1,
  difficulty: 'medium',

  setHumanName: (name) => set({ humanName: name }),
  setBotCount: (count) => set({ botCount: count }),
  setDifficulty: (d) => set({ difficulty: d }),

  startGame: () => {
    const { humanName, botCount, difficulty } = get();
    const deck = shuffle(createDeck());

    const usedAvatars: string[] = [];
    const players: Player[] = [
      { id: 0, name: humanName || 'You', isBot: false, avatar: '🧑', hand: [], memory: {} },
      ...Array.from({ length: botCount }, (_, i) => {
        const avatar = generateBotAvatar(usedAvatars);
        usedAvatars.push(avatar);
        return { id: i + 1, name: generateBotName(), isBot: true, avatar, hand: [], memory: {} };
      }),
    ];

    let idx = 0;
    const dealtPlayers = players.map(p => ({
      ...p,
      hand: deck.slice(idx, (idx += INITIAL_HAND_SIZE)),
    }));

    const firstDiscard = { ...deck[idx], isRevealed: true };
    const drawPile = deck.slice(idx + 1);

    set({
      ...INITIAL_STATE,
      humanName: get().humanName,
      botCount,
      difficulty,
      players: dealtPlayers,
      drawPile,
      discardPile: [firstDiscard],
      phase: 'SETUP_PEEK',
      setupPeeksRemaining: 2,
    });
  },

  setupPeek: (cardIndex) => {
    const { players, setupPeeksRemaining } = get();
    const human = players[0];
    if (human.hand[cardIndex].knownBy.includes(0)) return;

    const updatedHand = human.hand.map((c, i) =>
      i === cardIndex ? { ...c, isRevealed: true, knownBy: [0] } : c
    );
    const updatedPlayers = players.map((p, i) =>
      i === 0 ? { ...p, hand: updatedHand } : p
    );
    const remaining = setupPeeksRemaining - 1;
    set({ players: updatedPlayers, setupPeeksRemaining: remaining });

    setTimeout(() => {
      const s = get();
      const reHidden = s.players.map((p, pi) =>
        pi === 0
          ? { ...p, hand: p.hand.map((c, ci) => ci === cardIndex ? { ...c, isRevealed: false } : c) }
          : p
      );
      set({ players: reHidden });
      if (remaining === 0) {
        set({ phase: 'PLAYING', turnPhase: 'WAITING_FOR_DRAW' });
      }
    }, 3000);
  },

  drawFromDeck: () => {
    let { drawPile, discardPile } = get();
    if (drawPile.length === 0) {
      const reshuffled = reshuffleDiscard(discardPile);
      drawPile = reshuffled.newDrawPile;
      discardPile = reshuffled.newDiscardPile;
      if (drawPile.length === 0) return;
    }
    const [drawn, ...remaining] = drawPile;
    set({
      drawnCard: { ...drawn, isRevealed: true },
      drawnFrom: 'deck',
      drawPile: remaining,
      discardPile,
      turnPhase: 'HOLDING_DRAWN_CARD',
    });
  },

  drawFromDiscard: () => {
    const { discardPile } = get();
    if (discardPile.length === 0) return;
    const drawn = discardPile[discardPile.length - 1];
    set({
      drawnCard: { ...drawn, isRevealed: true },
      drawnFrom: 'discard',
      discardPile: discardPile.slice(0, -1),
      turnPhase: 'HOLDING_DRAWN_CARD',
    });
  },

  swapDrawnCard: (handIndex) => {
    const { drawnCard, players, currentPlayerIndex, discardPile } = get();
    if (!drawnCard) return;
    const player = players[currentPlayerIndex];
    const displaced = player.hand[handIndex];
    const updatedHand = player.hand.map((c, i) =>
      i === handIndex ? { ...drawnCard, isRevealed: false, knownBy: [currentPlayerIndex] } : c
    );
    const updatedPlayers = players.map((p, i) =>
      i === currentPlayerIndex ? { ...p, hand: updatedHand } : p
    );
    const discardedCard = { ...displaced, isRevealed: true, knownBy: [] as number[] };
    const newDiscardPile = [...discardPile, discardedCard];

    if (isActionablePowerCard(discardedCard)) {
      set({ players: updatedPlayers, discardPile: newDiscardPile, drawnCard: null, pendingPowerCard: discardedCard, turnPhase: 'POWER_CHOICE' });
    } else {
      set({ players: updatedPlayers, discardPile: newDiscardPile, drawnCard: null, slapLockUntil: Date.now() + HUMAN_GRACE_WINDOW_MS, turnPhase: 'END_TURN' });
      get().botEndTurn();
    }
  },

  discardDrawnCard: () => {
    const { drawnCard, discardPile, drawnFrom } = get();
    if (!drawnCard || drawnFrom === 'discard') return;
    const discardedCard = { ...drawnCard, isRevealed: true };
    const newDiscardPile = [...discardPile, discardedCard];
    if (isActionablePowerCard(discardedCard)) {
      set({ discardPile: newDiscardPile, drawnCard: null, pendingPowerCard: discardedCard, turnPhase: 'POWER_CHOICE' });
    } else {
      set({ discardPile: newDiscardPile, drawnCard: null, slapLockUntil: Date.now() + HUMAN_GRACE_WINDOW_MS, turnPhase: 'END_TURN' });
      get().botEndTurn();
    }
  },

  activatePower: () => {
    const { pendingPowerCard } = get();
    if (!pendingPowerCard) return;
    const powerMap: Record<string, { type: PowerType; totalSteps: number }> = {
      '7': { type: 'PEEK_OWN', totalSteps: 1 },
      '8': { type: 'PEEK_OWN', totalSteps: 1 },
      '9': { type: 'PEEK_OPPONENT', totalSteps: 1 },
      '10': { type: 'PEEK_OPPONENT', totalSteps: 1 },
      'J': { type: 'BLIND_SWAP', totalSteps: 2 },
      'Q': { type: 'PEEK_AND_SWAP', totalSteps: 2 },
      'K': { type: 'DOUBLE_PEEK_SWAP', totalSteps: 3 },
    };
    const config = powerMap[pendingPowerCard.rank];
    if (!config) return;
    const activePower: ActivePower = {
      type: config.type, cardId: pendingPowerCard.id,
      step: 1, totalSteps: config.totalSteps, selections: [], peekingCardId: null,
    };
    set({ activePower, pendingPowerCard: null, turnPhase: 'EXECUTING_POWER' });
  },

  skipPower: () => {
    set({ pendingPowerCard: null, slapLockUntil: Date.now() + HUMAN_GRACE_WINDOW_MS, turnPhase: 'END_TURN' });
    get().botEndTurn();
  },

  selectCardForPower: (playerIndex, cardIndex) => {
    const { activePower, players, currentPlayerIndex } = get();
    if (!activePower) return;
    const card = players[playerIndex].hand[cardIndex];

    if (activePower.type === 'PEEK_OWN' || activePower.type === 'PEEK_OPPONENT') {
      const updatedPlayers = players.map((p, pi) =>
        pi === playerIndex ? { ...p, hand: p.hand.map((c, ci) => ci === cardIndex ? { ...c, isRevealed: true } : c) } : p
      );
      // Null activePower immediately — prevents double-tap selecting a second card
      set({ players: updatedPlayers, activePower: null });
      if (players[currentPlayerIndex].isBot) get().updateBotMemory(currentPlayerIndex, card.id, card.value);
      setTimeout(() => {
        const s = get();
        const rehidden = s.players.map((p, pi) =>
          pi === playerIndex ? { ...p, hand: p.hand.map((c, ci) => ci === cardIndex ? { ...c, isRevealed: false } : c) } : p
        );
        set({ players: rehidden, slapLockUntil: Date.now() + HUMAN_GRACE_WINDOW_MS, turnPhase: 'END_TURN' });
        get().botEndTurn();
      }, 2000);
      return;
    }

    if (activePower.type === 'BLIND_SWAP') {
      const selections = [...activePower.selections, { playerIndex, cardIndex }];
      if (selections.length < 2) { set({ activePower: { ...activePower, step: 2, selections } }); return; }
      const [sel1, sel2] = selections;
      const card1 = players[sel1.playerIndex].hand[sel1.cardIndex];
      const card2 = players[sel2.playerIndex].hand[sel2.cardIndex];
      const updatedPlayers = players.map((p, pi) => {
        if (pi === sel1.playerIndex) return { ...p, hand: p.hand.map((c, ci) => ci === sel1.cardIndex ? { ...card2, isRevealed: false, knownBy: [] as number[] } : c) };
        if (pi === sel2.playerIndex) return { ...p, hand: p.hand.map((c, ci) => ci === sel2.cardIndex ? { ...card1, isRevealed: false, knownBy: [] as number[] } : c) };
        return p;
      });
      set({ players: updatedPlayers, activePower: null, slapLockUntil: Date.now() + HUMAN_GRACE_WINDOW_MS, turnPhase: 'END_TURN' });
      get().botEndTurn();
      return;
    }

    if (activePower.type === 'PEEK_AND_SWAP') {
      if (activePower.step === 1) {
        const updatedPlayers = players.map((p, pi) =>
          pi === playerIndex ? { ...p, hand: p.hand.map((c, ci) => ci === cardIndex ? { ...c, isRevealed: true } : c) } : p
        );
        set({ players: updatedPlayers, activePower: { ...activePower, step: 2, selections: [{ playerIndex, cardIndex }], peekingCardId: card.id } });
        setTimeout(() => {
          const s = get();
          const rehidden = s.players.map((p, pi) =>
            pi === playerIndex ? { ...p, hand: p.hand.map((c, ci) => ci === cardIndex ? { ...c, isRevealed: false } : c) } : p
          );
          set({ players: rehidden, activePower: s.activePower ? { ...s.activePower, peekingCardId: null } : null });
        }, 2000);
        return;
      }
      if (activePower.step === 2) {
        set({ activePower: { ...activePower, step: 3, selections: [...activePower.selections, { playerIndex, cardIndex }] } });
        return;
      }
      if (activePower.step === 3) {
        const ownSel = activePower.selections[activePower.selections.length - 1];
        const oppSel = { playerIndex, cardIndex };
        const ownCard = players[ownSel.playerIndex].hand[ownSel.cardIndex];
        const oppCard = players[oppSel.playerIndex].hand[oppSel.cardIndex];
        const updatedPlayers = players.map((p, pi) => {
          if (pi === ownSel.playerIndex) return { ...p, hand: p.hand.map((c, ci) => ci === ownSel.cardIndex ? { ...oppCard, isRevealed: false, knownBy: [] as number[] } : c) };
          if (pi === oppSel.playerIndex) return { ...p, hand: p.hand.map((c, ci) => ci === oppSel.cardIndex ? { ...ownCard, isRevealed: false, knownBy: [] as number[] } : c) };
          return p;
        });
        set({ players: updatedPlayers, activePower: null, slapLockUntil: Date.now() + HUMAN_GRACE_WINDOW_MS, turnPhase: 'END_TURN' });
        get().botEndTurn();
      }
      return;
    }

    if (activePower.type === 'DOUBLE_PEEK_SWAP') {
      if (activePower.step === 1 || activePower.step === 2) {
        const updatedPlayers = players.map((p, pi) =>
          pi === playerIndex ? { ...p, hand: p.hand.map((c, ci) => ci === cardIndex ? { ...c, isRevealed: true } : c) } : p
        );
        const newStep = activePower.step + 1;
        set({ players: updatedPlayers, activePower: { ...activePower, step: newStep, selections: [...activePower.selections, { playerIndex, cardIndex }], peekingCardId: card.id } });
        setTimeout(() => {
          const s = get();
          const rehidden = s.players.map((p, pi) =>
            pi === playerIndex ? { ...p, hand: p.hand.map((c, ci) => ci === cardIndex ? { ...c, isRevealed: false } : c) } : p
          );
          set({ players: rehidden, activePower: s.activePower ? { ...s.activePower, peekingCardId: null } : null });
        }, 2000);
        return;
      }
      if (activePower.step === 3) {
        set({ activePower: { ...activePower, step: 4, selections: [...activePower.selections, { playerIndex, cardIndex }] } });
        return;
      }
      if (activePower.step === 4) {
        const ownSel = activePower.selections[activePower.selections.length - 1];
        const oppSel = { playerIndex, cardIndex };
        const ownCard = players[ownSel.playerIndex].hand[ownSel.cardIndex];
        const oppCard = players[oppSel.playerIndex].hand[oppSel.cardIndex];
        const updatedPlayers = players.map((p, pi) => {
          if (pi === ownSel.playerIndex) return { ...p, hand: p.hand.map((c, ci) => ci === ownSel.cardIndex ? { ...oppCard, isRevealed: false, knownBy: [] as number[] } : c) };
          if (pi === oppSel.playerIndex) return { ...p, hand: p.hand.map((c, ci) => ci === oppSel.cardIndex ? { ...ownCard, isRevealed: false, knownBy: [] as number[] } : c) };
          return p;
        });
        set({ players: updatedPlayers, activePower: null, slapLockUntil: Date.now() + HUMAN_GRACE_WINDOW_MS, turnPhase: 'END_TURN' });
        get().botEndTurn();
      }
    }
  },

  skipPowerSwap: () => {
    set({ activePower: null, slapLockUntil: Date.now() + HUMAN_GRACE_WINDOW_MS, turnPhase: 'END_TURN' });
    get().botEndTurn();
  },

  attemptSlap: (playerIndex, cardIndex) => {
    const { players, discardPile, slapLockUntil, phase } = get();
    if (phase !== 'PLAYING' && phase !== 'CAMBIO_CALLED') return;
    if (slapLockUntil && Date.now() < slapLockUntil && playerIndex !== 0) return;
    // Prevent rapid double-tap penalty flooding for the human
    if (playerIndex === 0 && Date.now() < humanSlapCooldownUntil) return;

    const topDiscard = discardPile[discardPile.length - 1];
    if (!topDiscard) return;
    const slapCard = players[playerIndex]?.hand[cardIndex];
    if (!slapCard) return;
    const valid = slapCard.rank === topDiscard.rank;

    // Apply 800ms cooldown on any human slap attempt
    if (playerIndex === 0) humanSlapCooldownUntil = Date.now() + 800;

    if (valid) {
      const newDiscardPile = [...discardPile, { ...slapCard, isRevealed: true }];
      const updatedPlayers = players.map((p, pi) =>
        pi === playerIndex ? { ...p, hand: p.hand.filter((_, ci) => ci !== cardIndex) } : p
      );
      set({ players: updatedPlayers, discardPile: newDiscardPile, slapFXActive: true, slapLockUntil: Date.now() + 2000, lastSlapValid: true });
      setTimeout(() => set({ slapFXActive: false }), 700);
      const remainingHand = updatedPlayers[playerIndex].hand;
      if (remainingHand.length === 0) set({ phase: 'SCORING', cambioCalledBy: null });
    } else {
      let { drawPile } = get();
      if (drawPile.length === 0) {
        const reshuffled = reshuffleDiscard(discardPile);
        drawPile = reshuffled.newDrawPile;
        set({ discardPile: reshuffled.newDiscardPile });
      }
      if (drawPile.length === 0) return;
      const [penaltyCard, ...rest] = drawPile;
      const updatedPlayers = players.map((p, pi) =>
        pi === playerIndex ? { ...p, hand: [...p.hand, { ...penaltyCard, isRevealed: false, knownBy: [] as number[] }] } : p
      );
      set({ players: updatedPlayers, drawPile: rest, lastSlapValid: false });
      get().addToast(playerIndex === 0 ? '-1 card penalty!' : `${players[playerIndex].name} missed slap`, 'error');
    }
  },

  callCambio: (playerIndex) => {
    const { players, currentPlayerIndex, phase } = get();
    const callerIndex = playerIndex ?? currentPlayerIndex;
    if (phase !== 'PLAYING') return;
    set({
      cambioCalledBy: callerIndex,
      finalRoundRemaining: players.length - 1,
      phase: 'CAMBIO_CALLED',
      cambioFXActive: true,
      turnPhase: 'END_TURN',
    });
    setTimeout(() => set({ cambioFXActive: false }), 1200);
    get().botEndTurn();
  },

  advanceFinalRound: () => {
    const { finalRoundRemaining } = get();
    if (finalRoundRemaining <= 1) { set({ phase: 'SCORING', finalRoundRemaining: 0 }); }
    else { set({ finalRoundRemaining: finalRoundRemaining - 1 }); get().botEndTurn(); }
  },

  botEndTurn: () => {
    const { phase, players, currentPlayerIndex } = get();
    if (phase !== 'PLAYING' && phase !== 'CAMBIO_CALLED') return;
    const nextIndex = (currentPlayerIndex + 1) % players.length;
    if (phase === 'CAMBIO_CALLED') {
      const { finalRoundRemaining } = get();
      if (finalRoundRemaining <= 0) { set({ phase: 'SCORING' }); return; }
      set({ finalRoundRemaining: finalRoundRemaining - 1, currentPlayerIndex: nextIndex, turnPhase: 'WAITING_FOR_DRAW', turnNumber: get().turnNumber + 1 });
    } else {
      set({ currentPlayerIndex: nextIndex, turnPhase: 'WAITING_FOR_DRAW', turnNumber: get().turnNumber + 1 });
    }
  },

  addToast: (text, type) => {
    const id = Math.random().toString(36).slice(2);
    set(s => ({ toasts: [...s.toasts, { id, text, type }] }));
    setTimeout(() => get().clearToast(id), 2500);
  },

  clearToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  setSlapFX: (active) => set({ slapFXActive: active }),
  setCambioFX: (active) => set({ cambioFXActive: active }),

  updateBotMemory: (playerIndex, cardId, value) => {
    const { players, turnNumber } = get();
    const updatedPlayers = players.map((p, i) =>
      i === playerIndex ? { ...p, memory: { ...p.memory, [cardId]: { value, learnedAtTurn: turnNumber } } } : p
    );
    set({ players: updatedPlayers });
  },

  resetGame: () => set({ ...INITIAL_STATE, humanName: get().humanName, botCount: get().botCount, difficulty: get().difficulty }),
}));
