import { GoogleGenAI, Type } from "@google/genai";
import type { UserData, FitnessResults, WorkoutRoutineData } from '../types';
import { Gender, Goal } from '../types';

// FIX: Initialize the Gemini API client.
// The API key is sourced from environment variables, as per the guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Normalizes a method key string for consistent lookup, handling various aliases.
 * @param method The raw method string.
 * @returns A normalized, canonical key: 'navy' or 'deurenberg'.
 */
export const normalizeMethodKey = (method: string): 'navy' | 'deurenberg' => {
  if (!method) {
    console.warn(`normalizeMethodKey received an empty method. Defaulting to 'deurenberg'.`);
    return 'deurenberg';
  }

  const key = String(method).trim().toLowerCase();

  const navyAliases = ['navy', 'us_navy', 'us-navy', 'u.s. navy', 'usnavy'];
  const deurenbergAliases = ['deurenberg', 'deurenberg1991', 'd1991'];

  if (navyAliases.includes(key)) {
    return 'navy';
  }

  if (deurenbergAliases.includes(key)) {
    return 'deurenberg';
  }

  console.warn(`Unknown method key received: "${method}". Defaulting to 'deurenberg'.`);
  return 'deurenberg';
};


/**
 * Calculates fitness metrics based on user data.
 * @param data The user's input data.
 * @returns A FitnessResults object with calculated metrics.
 */
export function calculateFitnessMetrics(data: UserData): FitnessResults {
  const heightM = data.height / 100;
  const bmi = parseFloat((data.weight / (heightM * heightM)).toFixed(1));

  let bodyFatPercentage: number;
  let bodyFatMethod: 'navy' | 'deurenberg';

  // Determine which body fat calculation method to use
  const useNavy = data.neck && data.waist && (data.gender === Gender.Male || (data.gender === Gender.Female && data.hip));
  
  // Validate Navy measurements to prevent logarithmic errors
  let navyIsValid = false;
  if (useNavy) {
    if (data.gender === Gender.Male) {
      if (data.waist! > data.neck!) {
        navyIsValid = true;
      }
    } else { // Female
      if ((data.waist! + data.hip!) > data.neck!) {
        navyIsValid = true;
      }
    }
  }

  if (useNavy && navyIsValid) {
    bodyFatMethod = 'navy';
    if (data.gender === Gender.Male) {
      // U.S. Navy formula for men
      bodyFatPercentage = 495 / (1.0324 - 0.19077 * Math.log10(data.waist! - data.neck!) + 0.15456 * Math.log10(data.height)) - 450;
    } else { // Female
      // U.S. Navy formula for women
      bodyFatPercentage = 495 / (1.29579 - 0.35004 * Math.log10(data.waist! + data.hip! - data.neck!) + 0.22100 * Math.log10(data.height)) - 450;
    }
  } else {
    bodyFatMethod = 'deurenberg';
    const isMale = data.gender === Gender.Male ? 1 : 0;
    // Deurenberg (1991) formula as a fallback
    bodyFatPercentage = (1.20 * bmi) + (0.23 * data.age) - (10.8 * isMale) - 5.4;
  }
  
  bodyFatPercentage = parseFloat(Math.max(5, Math.min(50, bodyFatPercentage)).toFixed(1));

  // BMR (Mifflin-St Jeor)
  let bmr: number;
  if (data.gender === Gender.Male) {
    bmr = (10 * data.weight) + (6.25 * data.height) - (5 * data.age) + 5;
  } else {
    bmr = (10 * data.weight) + (6.25 * data.height) - (5 * data.age) - 161;
  }
  bmr = Math.round(bmr);

  // TDEE (based on PAL from FAO/WHO/UNU)
  // Physical Activity Level multipliers based on training days per week.
  // Source: FAO/WHO/UNU Expert Consultation Report.
  let pal: number;
  if (data.trainingDays <= 1) {
    pal = 1.40; // Sedentary or light activity lifestyle
  } else if (data.trainingDays <= 3) {
    pal = 1.55; // Moderately active lifestyle
  } else if (data.trainingDays <= 5) {
    pal = 1.70; // Vigorously active lifestyle
  } else { // 6-7 days
    pal = 1.85; // Very vigorously active lifestyle. Can be adjusted up to 1.90 for very high NEAT.
  }
  const tdee = Math.round(bmr * pal);

  // Target calories
  const maintenance = tdee;
  const cutting = tdee - Math.round(tdee * 0.15); // ~15% deficit
  const bulking = tdee + Math.round(tdee * 0.10); // ~10% surplus

  return {
    bmi,
    bodyFatPercentage,
    bodyFatMethod,
    bmr,
    tdee,
    targetCalories: {
      maintenance,
      bulking,
      cutting,
    },
  };
}

const workoutRoutineSchema = {
    type: Type.OBJECT,
    properties: {
        routineTitle: { type: Type.STRING, description: "Un título creativo y motivador para la rutina de entrenamiento. Ejemplo: 'Proyecto Titán: Fuerza e Hipertrofia'." },
        weeklySchedule: {
            type: Type.ARRAY,
            description: "Un array de objetos, donde cada objeto representa el entrenamiento de un día de la semana.",
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.STRING, description: "El día del entrenamiento. Ejemplo: 'Día 1: Pecho y Tríceps' o 'Lunes: Tren Superior'."},
                    focus: { type: Type.STRING, description: "El enfoque muscular o tipo de entrenamiento del día. Ejemplo: 'Hipertrofia de Pectorales' o 'Fuerza de Piernas'."},
                    exercises: {
                        type: Type.ARRAY,
                        description: "Una lista de los ejercicios para ese día.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: "Nombre del ejercicio. Ejemplo: 'Press de Banca Plano'."},
                                sets: { type: Type.STRING, description: "Número de series y repeticiones. Formato '3x8-12'. El rango de repeticiones debe ser apropiado para el objetivo (fuerza o hipertrofia)."},
                                notes: { type: Type.STRING, description: "Notas breves y útiles sobre la ejecución, tempo, o descanso. Ejemplo: 'Controla la bajada (2s)' o 'Descanso: 60-90s'."},
                            },
                             required: ["name", "sets", "notes"],
                        }
                    }
                },
                required: ["day", "focus", "exercises"],
            }
        },
        generalNotes: { type: Type.STRING, description: "Una nota general de 2-3 frases con consejos sobre la progresión, la importancia del descanso y la nutrición, adaptado al objetivo del usuario."}
    },
    required: ["routineTitle", "weeklySchedule", "generalNotes"],
};

/**
 * Generates a workout routine using the Gemini API.
 * @param userData The user's input data.
 * @param fitnessResults The calculated fitness metrics.
 * @returns A Promise that resolves to the generated WorkoutRoutineData.
 */
export async function generateWorkoutRoutine(userData: UserData, fitnessResults: FitnessResults): Promise<WorkoutRoutineData> {
  const goalText = {
    [Goal.Bulking]: "ganar masa muscular (volumen)",
    [Goal.Cutting]: "perder grasa manteniendo el músculo (definición)",
    [Goal.Maintenance]: "mantener su físico actual (mantenimiento)",
  };

  const prompt = `
    Eres un experto entrenador personal y nutricionista certificado.
    Crea un plan de entrenamiento de gimnasio detallado y optimizado para un usuario con las siguientes características y objetivos.
    Responde únicamente con el objeto JSON, sin texto introductorio, explicaciones adicionales o markdown.

    **Datos del Usuario:**
    - Edad: ${userData.age} años
    - Sexo: ${userData.gender === Gender.Male ? 'Hombre' : 'Mujer'}
    - Altura: ${userData.height} cm
    - Peso: ${userData.weight} kg
    - IMC: ${fitnessResults.bmi}
    - Porcentaje de grasa corporal estimado: ${fitnessResults.bodyFatPercentage}%
    - Días de entrenamiento por semana: ${userData.trainingDays}

    **Objetivos:**
    - Objetivo principal: ${goalText[userData.goal]}
    - Enfoque del entrenamiento: ${userData.focus}

    **Instrucciones para la rutina:**
    1.  Crea una rutina de ${userData.trainingDays} días. Si son 3 días, una rutina Full Body es ideal. Si son 4, una división Torso/Pierna o similar. Si son 5-6, una división Push/Pull/Legs o por grupos musculares.
    2.  El número de ejercicios por día debe ser razonable (entre 5 y 8).
    3.  El rango de repeticiones y las series deben ser coherentes con el enfoque de '${userData.focus}'. Para hipertrofia, rangos de 8-12 reps. Para fuerza, rangos de 3-6 reps. Puedes incluir ejercicios accesorios en rangos de hipertrofia incluso en rutinas de fuerza.
    4.  Selecciona los ejercicios más efectivos, priorizando compuestos (sentadillas, peso muerto, press banca, remos, press militar) y complementando con ejercicios de aislamiento.
    5.  Asegúrate de que la estructura del JSON de salida sea exactamente la que se define en el schema. No añadas propiedades extra.
  `;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: workoutRoutineSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedData = JSON.parse(jsonText);
    
    // Simple validation to ensure the parsed data looks like our interface
    if (parsedData.routineTitle && parsedData.weeklySchedule && parsedData.generalNotes) {
        return parsedData as WorkoutRoutineData;
    } else {
        throw new Error("La respuesta de la API no tiene el formato esperado.");
    }

  } catch (error) {
    console.error("Error al generar la rutina de entrenamiento:", error);
    throw new Error("No se pudo generar la rutina. Por favor, inténtalo de nuevo más tarde.");
  }
}