import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { calcFinalScores } from '../../lib/scoring';
import { Card } from './Card';

export function ScoringScreen() {
  const { players, cambioCalledBy, resetGame } = useGameStore();
  const [revealedPlayers, setRevealedPlayers] = useState<boolean[]>(players.map(() => false));

  const scores = calcFinalScores(players, cambioCalledBy);
  const winner = scores[0];

  useEffect(() => {
    let totalCards = 0;
    players.forEach(p => { totalCards += p.hand.length; });
    const timers: ReturnType<typeof setTimeout>[] = [];
    players.forEach((_, pi) => {
      const t = setTimeout(() => {
        setRevealedPlayers(prev => prev.map((v, i) => i === pi ? true : v));
      }, pi * 300 + 400);
      timers.push(t);
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen bg-[#080810] flex flex-col items-center px-4 py-8 gap-6 overflow-y-auto">
      <motion.h2
        className="font-['Space_Grotesk'] text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#9B5DE5] to-[#00F5FF]"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        FINAL SCORES
      </motion.h2>

      <motion.div
        className="bg-gradient-to-r from-[#9B5DE5]/20 to-[#00F5FF]/20 border border-[#9B5DE5]/40 rounded-2xl px-6 py-3 text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-[#F0F0FF]/50 text-xs uppercase tracking-widest">winner</p>
        <p className="text-[#F0F0FF] font-['Space_Grotesk'] text-xl font-black">
          {players[winner.playerIndex]?.avatar} {winner.name} — {winner.finalScore} pts
        </p>
      </motion.div>

      <div className="w-full flex flex-col gap-4">
        {scores.map((result, rank) => {
          const player = players[result.playerIndex];
          const isRevealed = revealedPlayers[result.playerIndex];
          return (
            <motion.div
              key={result.playerIndex}
              className="bg-[#1A1A2E] border border-[#9B5DE5]/20 rounded-2xl p-3"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rank * 0.08 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{player.avatar}</span>
                  <span className="text-[#F0F0FF] font-semibold text-sm">{player.name}</span>
                  {cambioCalledBy === result.playerIndex && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FF006E]/20 text-[#FF006E] font-bold">CAMBIO</span>
                  )}
                </div>
                <div className="text-right">
                  <span className={`font-['Space_Grotesk'] font-black text-lg ${rank === 0 ? 'text-[#00F5FF]' : 'text-[#F0F0FF]'}`}>
                    {result.finalScore}
                  </span>
                  {result.hasPenalty && (
                    <span className="text-[#FF006E] text-xs ml-1">+5</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5">
                {player.hand.map((card) => (
                  <Card
                    key={card.id}
                    card={{ ...card, isRevealed }}
                    size="sm"
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.button
        className="mt-4 px-8 py-4 rounded-2xl font-['Space_Grotesk'] font-black text-lg bg-gradient-to-r from-[#9B5DE5] to-[#00F5FF] text-[#080810]"
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        onClick={resetGame}
      >
        PLAY AGAIN
      </motion.button>
    </div>
  );
}
