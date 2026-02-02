import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from '@/pages/Home';
import Frases from '@/pages/Frases';
import Conversaciones from '@/pages/Conversaciones';
import Progreso from '@/pages/Progreso';
import Flashcards from '@/pages/Flashcards';
import Quiz from '@/pages/Quiz';
import Estudio from '@/pages/Estudio';
import Examen from '@/pages/Examen';
import Dashboard from '@/pages/Dashboard';
import Dictation from '@/pages/Dictation';
import Settings from '@/pages/Settings';

const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/frases" element={<Frases />} />
      <Route path="/conversaciones" element={<Conversaciones />} />
      <Route path="/dictado" element={<Dictation />} />
      <Route path="/progreso" element={<Progreso />} />
      <Route path="/flashcards" element={<Flashcards />} />
      <Route path="/quiz" element={<Quiz />} />
      <Route path="/estudio" element={<Estudio />} />
      <Route path="/examen" element={<Examen />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/configuracion" element={<Settings />} />
    </Routes>
  );
};

export default AppRouter;