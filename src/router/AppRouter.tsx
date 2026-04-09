import React, { Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import Home from '@/pages/Home';
import Frases from '@/pages/Frases';
import Conversaciones from '@/pages/Conversaciones';
import Flashcards from '@/pages/Flashcards';
import Quiz from '@/pages/Quiz';
import Estudio from '@/pages/Estudio';
import Examen from '@/pages/Examen';
import Dashboard from '@/pages/Dashboard';
import Dictation from '@/pages/Dictation';
import Settings from '@/pages/Settings';
import { PageSkeleton } from '@/components/Skeleton';

// Lazy load heavy page (recharts ~200KB)
const Progreso = React.lazy(() => import('@/pages/Progreso'));

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0, 0, 0.2, 1] as const } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const AnimatedPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    variants={pageTransition}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    {children}
  </motion.div>
);

const AppRouter: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<AnimatedPage><Home /></AnimatedPage>} />
        <Route path="/frases" element={<AnimatedPage><Frases /></AnimatedPage>} />
        <Route path="/conversaciones" element={<AnimatedPage><Conversaciones /></AnimatedPage>} />
        <Route path="/dictado" element={<AnimatedPage><Dictation /></AnimatedPage>} />
        <Route path="/progreso" element={
          <AnimatedPage>
            <Suspense fallback={<PageSkeleton />}>
              <Progreso />
            </Suspense>
          </AnimatedPage>
        } />
        <Route path="/flashcards" element={<AnimatedPage><Flashcards /></AnimatedPage>} />
        <Route path="/quiz" element={<AnimatedPage><Quiz /></AnimatedPage>} />
        <Route path="/estudio" element={<AnimatedPage><Estudio /></AnimatedPage>} />
        <Route path="/examen" element={<AnimatedPage><Examen /></AnimatedPage>} />
        <Route path="/dashboard" element={<AnimatedPage><Dashboard /></AnimatedPage>} />
        <Route path="/configuracion" element={<AnimatedPage><Settings /></AnimatedPage>} />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRouter;