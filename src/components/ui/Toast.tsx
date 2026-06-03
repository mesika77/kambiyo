import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';

export function ToastStack() {
  const { toasts } = useGameStore();
  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none w-72">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.9 }}
            className={`px-4 py-2 rounded-xl text-sm font-bold text-center shadow-lg ${
              t.type === 'error' ? 'bg-[#FF006E] text-white' :
              t.type === 'success' ? 'bg-[#00F5FF] text-[#080810]' :
              'bg-[#9B5DE5] text-white'
            }`}
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
