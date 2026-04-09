import { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import ModuleIntro from '@/components/ModuleIntro';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';

// Exam Feature Components
import ExamHeader from '../features/exam/components/ExamHeader';
import ExamSetup from '../features/exam/components/ExamSetup';
import ExamQuestion from '../features/exam/components/ExamQuestion';
import ExamResults from '../features/exam/components/ExamResults';
import { useExamLogic } from '../features/exam/hooks/useExamLogic';

export default function Examen() {
  const [showWelcome, setShowWelcome] = useState(true);
  const {
    examState,
    currentQuestion,
    currentIndex,
    totalQuestions,
    results,
    selectedOption,
    shuffledOptions,
    targetLanguage,
    frases,
    actions
  } = useExamLogic();

  if (showWelcome) {
    return (
      <PageContainer>
        <ModuleIntro
          title="Módulo de Examen"
          description="Certifica tus conocimientos. Completa el examen para validar lo que has aprendido y mejorar tu rango profesional."
          icon={ClipboardDocumentCheckIcon}
          onStart={() => setShowWelcome(false)}
          stats={[
            { label: 'Formato', value: 'Test' },
            { label: 'Exigencia', value: 'Alta' },
            { label: 'Premio', value: 'Insignia' }
          ]}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      title={examState === 'active' ? `Examen en progreso: ${currentIndex + 1}/${totalQuestions}` : 'Evaluación'}
    >
      <AnimatePresence mode="wait">
        {examState === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <ExamSetup 
              targetLanguage={targetLanguage}
              onStart={actions.startExam}
              onBack={() => setShowWelcome(true)}
            />
          </motion.div>
        )}

        {examState === 'active' && currentQuestion && (
          <motion.div
            key="active"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl mx-auto"
          >
            <ExamHeader 
              currentIndex={currentIndex}
              total={totalQuestions}
              onExit={actions.resetExam}
            />
            
            <ExamQuestion 
              question={currentQuestion.es}
              options={shuffledOptions}
              selectedOption={selectedOption}
              correctAnswer={(targetLanguage === 'eu' ? currentQuestion.eu : currentQuestion.en) || currentQuestion.en || ''}
              onAnswer={actions.handleAnswer}
            />
          </motion.div>
        )}

        {examState === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ExamResults 
              score={results.score}
              total={results.total}
              incorrectIds={results.incorrectIds}
              phrases={frases}
              targetLanguage={targetLanguage}
              onRestart={actions.resetExam}
              onExit={() => setShowWelcome(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}