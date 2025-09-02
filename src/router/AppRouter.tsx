import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import Frases from "@/pages/Frases";
import Conversaciones from "@/pages/Conversaciones";
import Flashcards from "@/pages/Flashcards";
import Quiz from "@/pages/Quiz";
import Examen from "@/pages/Examen";
import Estudio from "@/pages/Estudio";
import Dashboard from "@/pages/Dashboard";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/frases" element={<Frases />} />
        <Route path="/conversaciones" element={<Conversaciones />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/examen" element={<Examen />} />
        <Route path="/estudio" element={<Estudio />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
