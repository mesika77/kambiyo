import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';

export function SlapFX() {
  const { slapFXActive } = useGameStore();
  return (
    <AnimatePresence>
      {slapFXActive && (
        <>
          <motion.div
            key="shake"
            className="fixed inset-0 z-40 pointer-events-none"
            animate={{ x: [0, -4, 4, -4, 4, 0], y: [0, 2, -2, 2, -2, 0] }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
          <motion.div
            key="lightning"
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.8, 0] }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-8xl drop-shadow-[0_0_20px_#FF006E]">⚡</div>
            <div className="absolute inset-0 bg-[#FF006E]/10" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
