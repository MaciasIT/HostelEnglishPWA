import { useState, useEffect } from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_META } from '@/services/certificationCalculator';

interface ExamSetupProps {
  onStart: (config: { limit: number; role: string; studentName: string }) => void;
  onBack: () => void;
  targetLanguage: 'en' | 'eu' | 'es';
}

const ROLES = [
  { value: 'recepcion', label: 'Recepción Hotelera', icon: '🏨' },
  { value: 'restaurante', label: 'Restaurante / Servicio', icon: '🍽️' },
  { value: 'bar', label: 'Barra y Cafetería', icon: '☕' },
  { value: 'limpieza', label: 'Limpieza y Pisos', icon: '🧹' },
  { value: 'mantenimiento', label: 'Mantenimiento', icon: '🔧' },
] as const;

export default function ExamSetup({ onStart, onBack, targetLanguage }: ExamSetupProps) {
  const prefs = useAppStore(state => state.prefs);
  const setPreferredRole = useAppStore(state => state.setPreferredRole);
  const saveStudentName = useAppStore(state => state.setStudentName);

  const langLabel = targetLanguage === 'eu' ? 'euskera' : 'inglés';
  const [selectedRole, setSelectedRole] = useState(prefs.preferredRole || 'bar');
  const [studentName, setStudentName] = useState(prefs.studentName || '');
  const [isRoleCert, setIsRoleCert] = useState(true);

  useEffect(() => {
    if (typeof setPreferredRole === 'function') {
      setPreferredRole(selectedRole);
    }
  }, [selectedRole, setPreferredRole]);

  useEffect(() => {
    if (typeof saveStudentName === 'function') {
      saveStudentName(studentName);
    }
  }, [studentName, saveStudentName]);

  const handleStart = () => {
    if (isRoleCert) {
      onStart({ limit: 10, role: selectedRole, studentName: studentName.trim() || 'Estudiante' });
    } else {
      onStart({ limit: 10, role: '', studentName: '' });
    }
  };

  const selectedRoleMeta = ROLES.find(r => r.value === selectedRole);

  return (
    <div className="max-w-2xl mx-auto py-12 text-center">
      <div className="bg-surface/5 p-10 rounded-[3rem] border border-border/10 shadow-2xl backdrop-blur-xl mb-8">
        <ShieldCheckIcon className="w-16 h-16 text-accent mx-auto mb-6" />

        {/* Exam type toggle */}
        <div className="flex bg-surface/5 rounded-2xl p-1 mb-8 max-w-sm mx-auto">
          <button
            onClick={() => setIsRoleCert(false)}
            className={`flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
              !isRoleCert ? 'bg-surface/10 text-primary shadow-lg' : 'text-tertiary hover:text-primary'
            }`}
          >
            Examen Global
          </button>
          <button
            onClick={() => setIsRoleCert(true)}
            className={`flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
              isRoleCert ? 'bg-accent text-primary shadow-lg' : 'text-tertiary hover:text-primary'
            }`}
          >
            Certificación por Rol
          </button>
        </div>

        {!isRoleCert ? (
          <>
            <h2 className="text-3xl font-black text-primary mb-4">Examen Global</h2>
            <p className="text-tertiary mb-8 max-w-md mx-auto">
              Se te presentarán 10 frases aleatorias en <span className="text-accent font-bold">{langLabel}</span>. 
              Debes acertar al menos el <span className="text-primary font-bold">80%</span> para considerarlo superado.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-black text-primary mb-2">Certificación Laboral</h2>
            <p className="text-accent font-bold text-sm mb-6">
              {ROLE_META[selectedRole]?.title || `Certificación: ${selectedRoleMeta?.label}`}
            </p>

            {/* Role selector */}
            <div className="mb-6">
              <p className="text-[10px] uppercase font-black tracking-[0.2em] text-tertiary mb-3">
                Selecciona tu puesto
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ROLES.map(role => (
                  <button
                    key={role.value}
                    onClick={() => setSelectedRole(role.value)}
                    className={`p-4 rounded-2xl border-2 transition-all text-center ${
                      selectedRole === role.value
                        ? 'bg-accent/20 border-accent text-primary'
                        : 'bg-surface/5 border-border/10 text-tertiary hover:border-border/30 hover:text-primary'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{role.icon}</span>
                    <span className="text-[11px] font-bold leading-tight block">{role.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Student name input */}
            <div className="mb-8 max-w-sm mx-auto">
              <label htmlFor="studentName" className="text-[10px] uppercase font-black tracking-[0.2em] text-tertiary mb-2 block text-left">
                Nombre completo
              </label>
              <input
                id="studentName"
                type="text"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder="Tu nombre para el certificado"
                className="w-full bg-surface/5 border border-border/10 rounded-2xl px-5 py-3 text-primary text-sm font-semibold placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </>
        )}

        <div className="space-y-4">
          <button
            onClick={handleStart}
            className="w-full bg-accent hover:brightness-110 text-primary font-black py-4 rounded-2xl text-xl shadow-lg transition-all active:scale-95"
          >
            {isRoleCert ? 'Iniciar Certificación' : 'Comenzar Examen'}
          </button>
          <button
            onClick={onBack}
            className="w-full bg-surface/5 hover:bg-surface/10 text-primary font-bold py-3 rounded-2xl transition-all text-sm uppercase tracking-widest"
          >
            Volver
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 px-6 text-[10px] font-black uppercase tracking-widest text-tertiary">
        <div>10 Preguntas</div>
        <div>Por Rol</div>
        <div>70% Mínimo</div>
      </div>
    </div>
  );
}
