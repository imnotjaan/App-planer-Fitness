import React, { useState } from 'react';
import FitnessForm from './components/FitnessForm';
import ResultsDisplay from './components/ResultsDisplay';
import { calculateFitnessMetrics, generateWorkoutRoutine } from './services/api';
import type { UserData, FitnessResults, WorkoutRoutineData } from './types';

// FIX: Create the main App component to handle application state and logic.
function App() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [results, setResults] = useState<FitnessResults | null>(null);
  const [routine, setRoutine] = useState<WorkoutRoutineData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: UserData) => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    setRoutine(null);
    setUserData(data);

    try {
      // Step 1: Perform local calculations
      const fitnessMetrics = calculateFitnessMetrics(data);
      setResults(fitnessMetrics);

      // Step 2: Call AI to generate workout routine
      const workoutRoutine = await generateWorkoutRoutine(data, fitnessMetrics);
      setRoutine(workoutRoutine);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
      }
      // Clear partial results on error
      setResults(null);
      setRoutine(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setUserData(null);
    setResults(null);
    setRoutine(null);
    setError(null);
    setIsLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center p-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
            <h2 className="text-xl font-semibold text-text-primary">Analizando tus datos y creando tu plan...</h2>
            <p className="text-text-secondary">Esto puede tardar unos segundos. ¡Gracias por tu paciencia!</p>
        </div>
      );
    }
    
    if (error) {
      return (
         <div className="text-center p-8 bg-base-200 rounded-lg">
            <h2 className="text-xl font-semibold text-red-500">¡Ups! Algo salió mal</h2>
            <p className="text-text-secondary mt-2 mb-4">{error}</p>
            <button
                onClick={handleReset}
                className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-500 transition-colors"
            >
                Intentar de Nuevo
            </button>
        </div>
      );
    }

    if (results && routine && userData) {
      return (
        <>
            <ResultsDisplay results={results} routine={routine} userData={userData} />
             <div className="mt-6 text-center space-x-4">
                <button
                    onClick={handlePrint}
                    className="bg-brand-secondary text-white font-bold py-2 px-6 rounded-lg hover:bg-emerald-400 transition-colors"
                >
                    Imprimir/Descargar PDF
                </button>
                <button
                    onClick={handleReset}
                    className="bg-gray-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-500 transition-colors"
                >
                    Empezar de Nuevo
                </button>
            </div>
        </>
      );
    }

    return <FitnessForm onSubmit={handleSubmit} isLoading={isLoading} />;
  }

  return (
    <div className="bg-base-100 min-h-screen text-text-primary font-sans">
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <header className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-brand-primary">
                Fitness Plan AI
            </h1>
            <p className="mt-2 text-lg text-text-secondary">
                Tu entrenador personal inteligente. Ingresa tus datos y obtén un plan de nutrición y entrenamiento personalizado por IA.
            </p>
        </header>

        {renderContent()}

        <footer className="text-center mt-12 text-sm text-text-secondary">
            <p>&copy; {new Date().getFullYear()} Fitness Plan AI. Creado con la tecnología de Google Gemini.</p>
        </footer>
      </main>
    </div>
  );
}

export default App;