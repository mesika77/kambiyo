import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { calcFinalScores } from '../../lib/scoring';
import type { ScoreResult } from '../../lib/scoring';
import type { Player } from '../../types/game';
import { Card } from './Card';

interface RevealPanelProps {
  player: Player;
  result: ScoreResult;
  revealedIds: Set<string>;
  showScore: boolean;
  isWinner: boolean;
  isCaller: boolean;
  cardSize: 'xs' | 'sm' | 'md';
  isHuman?: boolean;
}

function RevealPanel({ player, result, revealedIds, showScore, isWinner, isCaller, cardSize, isHuman }: RevealPanelProps) {
  return (
    <motion.div
      className={`flex flex-col items-center gap-1.5 px-2 py-2 rounded-2xl flex-1 min-w-0 transition-colors duration-500 ${
        isWinner ? 'bg-[#00F5FF]/10 ring-1 ring-[#00F5FF]/40' : 'bg-[#0F0F1A]/70'
      }`}
    >
      {/* Avatar + name row */}
      <div className="flex items-center gap-1 w-full justify-center">
        <span className={isHuman ? 'text-2xl' : 'text-lg'}>{player.avatar}</span>
        <span className="text-[#F0F0FF]/70 text-[10px] font-semibold truncate max-w-[70px]">{player.name}</span>
        {isCaller && (
          <span className="text-[8px] px-1 py-0.5 rounded bg-[#FF006E]/20 text-[#FF006E] font-bold shrink-0">C</span>
        )}
        {isWinner && (
          <span className="text-[8px] px-1 py-0.5 rounded bg-[#00F5FF]/20 text-[#00F5FF] font-bold shrink-0">WIN</span>
        )}
      </div>

      {/* Cards */}
      {isHuman ? (
        <div className="grid grid-cols-2 gap-2">
          {player.hand.map(card => (
            <Card
              key={card.id}
              card={{ ...card, isRevealed: revealedIds.has(card.id) }}
              size="md"
            />
          ))}
        </div>
      ) : (
        <div className="flex gap-0.5 flex-wrap justify-center">
          {player.hand.map(card => (
            <Card
              key={card.id}
              card={{ ...card, isRevealed: revealedIds.has(card.id) }}
              size={cardSize}
            />
          ))}
        </div>
      )}

      {/* Score badge */}
      <AnimatePresence>
        {showScore && (
          <motion.div
            className="flex items-baseline gap-1"
            initial={{ opacity: 0, scale: 0.5, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
          >
            <span className={`font-['Space_Grotesk'] font-black text-xl ${isWinner ? 'text-[#00F5FF]' : 'text-[#F0F0FF]'}`}>
              {result.finalScore}
            </span>
            <span className="text-[#F0F0FF]/40 text-xs">pts</span>
            {result.hasPenalty && (
              <span className="text-[#FF006E] text-[9px] font-bold">+5</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ScoringScreen() {
  const { players, cambioCalledBy, resetGame } = useGameStore();

  const [showFlash, setShowFlash]         = useState(true);
  const [showBoard, setShowBoard]         = useState(false);
  const [revealedIds, setRevealedIds]     = useState<Set<string>>(new Set());
  const [showScores, setShowScores]       = useState(false);
  const [showWinner, setShowWinner]       = useState(false);
  const [showPlayAgain, setShowPlayAgain] = useState(false);

  const scores  = calcFinalScores(players, cambioCalledBy);
  const winner  = scores[0];
  const bots    = players.slice(1);
  const human   = players[0];
  const botCardSize = bots.length <= 2 ? 'sm' : 'xs';

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Flash duration
    timers.push(setTimeout(() => { setShowFlash(false); setShowBoard(true); }, 1300));

    // Stagger card flips — start shortly after flash
    let delay = 1600;
    players.forEach(player => {
      player.hand.forEach(card => {
        const id = card.id;
        timers.push(setTimeout(() =>
          setRevealedIds(prev => { const s = new Set(prev); s.add(id); return s; }),
          delay
        ));
        delay += 110;
      });
    });

    // Scores / winner / play-again cascade after all cards flipped
    timers.push(setTimeout(() => setShowScores(true),   delay + 200));
    timers.push(setTimeout(() => setShowWinner(true),   delay + 500));
    timers.push(setTimeout(() => setShowPlayAgain(true), delay + 1100));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen bg-[#080810] flex flex-col relative select-none">

      {/* ── CAMBIO FLASH ── */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            key="flash"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          >
            <div className="absolute inset-0 bg-[#080810]" />

            <motion.div
              className="relative flex flex-col items-center gap-4"
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            >
              <motion.span
                className="text-7xl drop-shadow-[0_0_40px_#FF006E]"
                animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                🔥
              </motion.span>
              <span className="font-['Space_Grotesk'] font-black text-6xl text-[#FF006E] tracking-widest drop-shadow-[0_0_40px_#FF006E]">
                CAMBIO
              </span>
              {cambioCalledBy !== null && (
                <motion.p
                  className="text-[#F0F0FF]/50 text-sm tracking-wide"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  called by {players[cambioCalledBy]?.name}
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOARD-SHAPED REVEAL ── */}
      <motion.div
        className="flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: showBoard ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Bots row — mirrors the Board layout */}
        <div className="flex-none pt-3 pb-2 px-3">
          <div className="flex gap-2 justify-around items-start">
            {bots.map(bot => {
              const result = scores.find(s => s.playerIndex === bot.id)!;
              return (
                <RevealPanel
                  key={bot.id}
                  player={bot}
                  result={result}
                  revealedIds={revealedIds}
                  showScore={showScores}
                  isWinner={result.playerIndex === winner.playerIndex}
                  isCaller={cambioCalledBy === bot.id}
                  cardSize={botCardSize}
                />
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="flex-none mx-4 h-px bg-gradient-to-r from-transparent via-[#9B5DE5]/30 to-transparent" />

        {/* Center — winner callout + score table */}
        <div className="flex-none py-4 px-4 flex flex-col items-center gap-2">
          <AnimatePresence>
            {showWinner && (
              <motion.div
                className="w-full bg-gradient-to-r from-[#FF006E]/10 via-[#9B5DE5]/10 to-[#00F5FF]/10 border border-[#00F5FF]/30 rounded-2xl px-4 py-3 text-center"
                initial={{ opacity: 0, scale: 0.8, y: -12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <p className="text-[#F0F0FF]/40 text-[9px] uppercase tracking-widest mb-1">winner</p>
                <p className="font-['Space_Grotesk'] font-black text-xl text-[#00F5FF]">
                  {players[winner.playerIndex]?.avatar} {winner.name}
                </p>
                <p className="text-[#00F5FF]/70 text-sm font-semibold">{winner.finalScore} pts</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showScores && (
              <motion.div
                className="w-full flex flex-col gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {scores.map((r, rank) => (
                  <motion.div
                    key={r.playerIndex}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-xl ${
                      rank === 0
                        ? 'bg-[#00F5FF]/10 border border-[#00F5FF]/20'
                        : 'bg-[#1A1A2E]/50'
                    }`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: rank * 0.07 }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{players[r.playerIndex]?.avatar}</span>
                      <span className="text-[#F0F0FF]/70 text-xs font-medium">{r.name}</span>
                      {r.hasPenalty && (
                        <span className="text-[#FF006E] text-[8px] font-bold">+5 PEN</span>
                      )}
                    </div>
                    <span className={`font-['Space_Grotesk'] font-black text-sm ${rank === 0 ? 'text-[#00F5FF]' : 'text-[#F0F0FF]/80'}`}>
                      {r.finalScore} pts
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="flex-none mx-4 h-px bg-gradient-to-r from-transparent via-[#9B5DE5]/20 to-transparent" />

        {/* Human reveal panel */}
        <div className="flex-1 flex flex-col px-3 pt-2">
          {human && (() => {
            const result = scores.find(s => s.playerIndex === 0)!;
            return (
              <RevealPanel
                player={human}
                result={result}
                revealedIds={revealedIds}
                showScore={showScores}
                isWinner={result.playerIndex === winner.playerIndex}
                isCaller={cambioCalledBy === 0}
                cardSize="md"
                isHuman
              />
            );
          })()}
        </div>

        {/* Play Again */}
        <div className="flex-none pt-4 pb-16 flex justify-center">
          <AnimatePresence>
            {showPlayAgain && (
              <motion.button
                className="px-10 py-4 rounded-2xl font-['Space_Grotesk'] font-black text-xl bg-gradient-to-r from-[#9B5DE5] to-[#00F5FF] text-[#080810] shadow-lg shadow-[#9B5DE5]/30"
                initial={{ opacity: 0, scale: 0.7, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                whileTap={{ scale: 0.96 }}
                onClick={resetGame}
              >
                PLAY AGAIN
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
