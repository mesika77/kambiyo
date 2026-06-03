import { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { LandingScreen } from './components/landing/LandingScreen';
import { Board } from './components/game/Board';
import { ScoringScreen } from './components/game/ScoringScreen';
import { useBotAI } from './hooks/useBotAI';
import { useSlap } from './hooks/useSlap';

function GameApp() {
  useBotAI();
  useSlap();
  const { phase } = useGameStore();

  if (phase === 'SETUP_PEEK' || phase === 'PLAYING' || phase === 'CAMBIO_CALLED') {
    return <Board />;
  }
  if (phase === 'SCORING') {
    return <ScoringScreen />;
  }
  return null;
}

export default function App() {
  const phase = useGameStore(s => s.phase);

  useEffect(() => {
    if ('screen' in window && 'orientation' in window.screen) {
      (window.screen.orientation as any).lock?.('portrait').catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#080810] flex items-start justify-center">
      <div className="w-full max-w-[430px] min-h-screen relative">
        {phase === 'LANDING' ? <LandingScreen /> : <GameApp />}
      </div>
    </div>
  );
}
