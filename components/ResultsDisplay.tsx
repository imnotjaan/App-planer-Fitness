

import React from 'react';
import type { FitnessResults, WorkoutRoutineData, UserData } from '../types';
import { Goal } from '../types';
import { normalizeMethodKey } from '../services/api';

// This global declaration informs TypeScript about the METHOD_SOURCES object defined in index.html
declare global {
    interface Window {
        METHOD_SOURCES: {
            [key: string]: { name: string; note: string; };
        }
    }
}

// --- Helper & Sub-components defined in the same file for consolidation ---

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  return (
    <div className="relative flex items-center group">
      {children}
      <div className="absolute top-full mt-2 right-0 max-w-[calc(100vw-2rem)] w-max bg-base-300 text-text-primary text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 shadow-lg break-words">
        {text}
      </div>
    </div>
  );
};

const InfoIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-text-secondary cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  tooltipText: string;
  colorClass?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, tooltipText, colorClass = 'text-brand-primary' }) => (
  <div className="bg-base-200 p-4 rounded-lg flex flex-col justify-between shadow-md border border-base-300">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
      <Tooltip text={tooltipText}>
        <InfoIcon />
      </Tooltip>
    </div>
    <div className="text-3xl font-bold mt-2">
      <span className={colorClass}>{value}</span>
      <span className="text-lg text-text-secondary ml-1">{unit}</span>
    </div>
  </div>
);

const WorkoutRoutineDisplay: React.FC<{ routine: WorkoutRoutineData }> = ({ routine }) => {
    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold text-center text-brand-secondary">{routine.routineTitle}</h2>
            <p className="text-center text-text-secondary mt-2 mb-6">{routine.generalNotes}</p>
            <div className="space-y-6">
                {routine.weeklySchedule.map((day, index) => (
                    <div key={index} className="bg-base-200 p-5 rounded-lg border border-base-300 shadow-md">
                        <h3 className="text-lg font-bold text-brand-primary">{day.day} - <span className="font-normal text-text-secondary">{day.focus}</span></h3>
                        <div className="mt-4 divide-y divide-base-300">
                            {day.exercises.map((ex, exIndex) => (
                                <div key={exIndex} className="py-3 grid grid-cols-3 gap-4 items-start">
                                    <div className="font-semibold col-span-1">{ex.name}</div>
                                    <div className="text-center text-text-primary">{ex.sets}</div>
                                    <div className="text-sm text-text-secondary col-span-1 text-right">{ex.notes}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Main Results Display Component ---

interface ResultsDisplayProps {
  results: FitnessResults;
  routine: WorkoutRoutineData | null;
  userData: UserData;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, routine, userData }) => {
  const goalColorMap = {
      [Goal.Bulking]: "text-green-400",
      [Goal.Cutting]: "text-blue-400",
      [Goal.Maintenance]: "text-yellow-400"
  }
  const selectedGoalCalories = results.targetCalories[userData.goal];

  // Robustly get method metadata using the normalizer
  const methodKey = normalizeMethodKey(results.bodyFatMethod);
  const bodyFatMethodInfo = window.METHOD_SOURCES?.[methodKey] || window.METHOD_SOURCES?.deurenberg || {
      name: 'Deurenberg (1991)',
      note: 'Usa IMC, edad y sexo como estimación poblacional.',
  };
  
  const bodyFatTitle = `% Grasa (${bodyFatMethodInfo.name})`;
  const bodyFatTooltip = bodyFatMethodInfo.note;

  return (
    <div id="reporte" className="w-full bg-base-100 p-6 md:p-8 rounded-2xl mt-8">
      <h2 className="text-3xl font-bold text-center mb-6">Tu Plan Personalizado</h2>
      
      {/* Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="IMC" value={results.bmi} unit="" tooltipText="Índice de Masa Corporal. Una estimación poblacional, no un diagnóstico individual." />
        <MetricCard title={bodyFatTitle} value={results.bodyFatPercentage} unit="%" tooltipText={bodyFatTooltip} />
        <MetricCard title="Metabolismo Basal (BMR)" value={results.bmr} unit="kcal" tooltipText="Calorías que tu cuerpo quema en reposo total. Calculado con la fórmula de Mifflin-St Jeor." />
        <MetricCard title="Gasto Energético Total (TDEE)" value={results.tdee} unit="kcal" tooltipText="Estimación de calorías quemadas en un día, incluyendo actividad. Basado en factores PAL de la FAO/WHO/UNU." />
      </div>

      {/* Calories Section */}
      <div className="mt-8 bg-base-200 p-6 rounded-lg border border-base-300 shadow-md">
          <h3 className="text-xl font-bold text-center">Calorías Objetivo Diarias</h3>
          <p className="text-center text-text-secondary text-sm mt-1 mb-6">Estos son puntos de partida. Monitoriza tu progreso y ajusta si es necesario.</p>
          <div className="flex flex-col md:flex-row justify-around items-center gap-4">
              <div className={`text-center p-4 rounded-lg ${userData.goal === Goal.Cutting ? 'bg-blue-900/50 ring-2 ring-blue-400' : ''}`}>
                  <h4 className="font-semibold text-blue-400">Definición</h4>
                  <p className="text-2xl font-bold">{results.targetCalories.cutting} kcal/día</p>
              </div>
              <div className={`text-center p-4 rounded-lg ${userData.goal === Goal.Maintenance ? 'bg-yellow-900/50 ring-2 ring-yellow-400' : ''}`}>
                  <h4 className="font-semibold text-yellow-400">Mantenimiento</h4>
                  <p className="text-2xl font-bold">{results.targetCalories.maintenance} kcal/día</p>
              </div>
              <div className={`text-center p-4 rounded-lg ${userData.goal === Goal.Bulking ? 'bg-green-900/50 ring-2 ring-green-400' : ''}`}>
                  <h4 className="font-semibold text-green-400">Volumen</h4>
                  <p className="text-2xl font-bold">{results.targetCalories.bulking} kcal/día</p>
              </div>
          </div>
      </div>

      {/* Workout Routine Section */}
      {routine && <WorkoutRoutineDisplay routine={routine} />}
      
      {/* Disclaimer */}
      <div className="mt-8 text-xs text-text-secondary text-center bg-base-200 p-4 rounded-lg">
          <p className="font-bold mb-2">Aviso Importante</p>
          <p>Las métricas son estimaciones para adultos y no sustituyen una evaluación clínica. Los objetivos calóricos son puntos de partida; monitoriza tu peso y medidas durante 2-4 semanas y ajusta ±100-200 kcal según tu respuesta. Consulta siempre a un profesional de la salud o del deporte antes de iniciar un nuevo plan de nutrición o entrenamiento.</p>
      </div>
    </div>
  );
};

export default ResultsDisplay;