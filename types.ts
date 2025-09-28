export enum Gender {
  Male = 'male',
  Female = 'female',
}

export enum Goal {
  Maintenance = 'maintenance',
  Bulking = 'bulking',
  Cutting = 'cutting',
}

export enum Focus {
  Strength = 'strength',
  Hypertrophy = 'hypertrophy',
}

export interface UserData {
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  trainingDays: number;
  goal: Goal;
  focus: Focus;
  neck?: number;
  waist?: number;
  hip?: number;
}

export interface FitnessResults {
  bmi: number;
  bodyFatPercentage: number;
  bodyFatMethod: 'navy' | 'deurenberg';
  bmr: number;
  tdee: number;
  targetCalories: {
    maintenance: number;
    bulking: number;
    cutting: number;
  };
}

export interface Exercise {
  name: string;
  sets: string;
  notes: string;
}

export interface DailyWorkout {
  day: string;
  focus: string;
  exercises: Exercise[];
}

export interface WorkoutRoutineData {
  routineTitle: string;
  weeklySchedule: DailyWorkout[];
  generalNotes: string;
}
