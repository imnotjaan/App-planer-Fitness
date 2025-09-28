import React, { useState, useMemo, useEffect } from 'react';
import type { UserData } from '../types';
import { Gender, Goal, Focus } from '../types';

interface FitnessFormProps {
  onSubmit: (data: UserData) => void;
  isLoading: boolean;
}

interface FormState extends Omit<UserData, 'age' | 'height' | 'weight' | 'trainingDays' | 'neck' | 'waist' | 'hip'> {
  age: string;
  height: string;
  weight: string;
  trainingDays: string;
  neck: string;
  waist: string;
  hip: string;
}

const initialFormState: FormState = {
  age: '',
  gender: Gender.Male,
  height: '',
  weight: '',
  trainingDays: '4',
  goal: Goal.Bulking,
  focus: Focus.Hypertrophy,
  neck: '',
  waist: '',
  hip: '',
};

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
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5 text-text-secondary cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);


const FitnessForm: React.FC<FitnessFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [debouncedFormData, setDebouncedFormData] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // DEBOUNCE POINT: This effect listens for changes in the form's immediate state (formData)
  // and updates a debounced state (debouncedFormData) after a 300ms delay.
  // All expensive calculations (validation memos) are tied to the debounced state
  // to prevent them from running on every keystroke.
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFormData(formData);
    }, 300);
    return () => {
      clearTimeout(handler);
    };
  }, [formData]);


  const navyValidationWarning = useMemo(() => {
    const neck = parseFloat(debouncedFormData.neck);
    const waist = parseFloat(debouncedFormData.waist);
    const hip = parseFloat(debouncedFormData.hip);

    if (!waist || !neck) return null;

    if (debouncedFormData.gender === Gender.Male) {
      if (waist > 0 && neck > 0 && waist <= neck) {
        return "Aviso: La medida de la cintura debe ser mayor que la del cuello para usar el método Navy. Se usará el método de respaldo.";
      }
    } else {
      if (!hip) return null;
      if (waist > 0 && neck > 0 && hip > 0 && (waist + hip) <= neck) {
        return "Aviso: La suma de cintura y cadera debe ser mayor que el cuello para usar el método Navy. Se usará el método de respaldo.";
      }
    }
    return null;
  }, [debouncedFormData.neck, debouncedFormData.waist, debouncedFormData.hip, debouncedFormData.gender]);

  const validateField = (name: string, value: string): string => {
    if (['neck', 'waist', 'hip'].includes(name) && value === '') return "";

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "Debe ser un número.";
    
    switch (name) {
      case 'age':
        if (numValue < 16 || numValue > 99) return "Edad entre 16 y 99.";
        break;
      case 'height':
        if (numValue < 120 || numValue > 250) return "Altura entre 120 y 250 cm.";
        break;
      case 'weight':
        if (numValue < 30 || numValue > 300) return "Peso entre 30 y 300 kg.";
        break;
      case 'neck':
      case 'waist':
      case 'hip':
        if (numValue < 0) return "No puede ser negativo.";
        break;
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };
  
  const isFormValid = useMemo(() => {
    const currentErrors = {
      age: validateField('age', debouncedFormData.age),
      height: validateField('height', debouncedFormData.height),
      weight: validateField('weight', debouncedFormData.weight),
      neck: validateField('neck', debouncedFormData.neck),
      waist: validateField('waist', debouncedFormData.waist),
      hip: validateField('hip', debouncedFormData.hip),
    };
    return Object.values(currentErrors).every(e => e === "") && debouncedFormData.age && debouncedFormData.height && debouncedFormData.weight;
  }, [debouncedFormData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate against the LATEST data on submit
    const currentErrors = {
        age: validateField('age', formData.age),
        height: validateField('height', formData.height),
        weight: validateField('weight', formData.weight),
        neck: validateField('neck', formData.neck),
        waist: validateField('waist', formData.waist),
        hip: validateField('hip', formData.hip),
    };
    const canSubmit = Object.values(currentErrors).every(e => e === "") && formData.age && formData.height && formData.weight;
    
    if (canSubmit) {
      onSubmit({
        age: parseInt(formData.age),
        gender: formData.gender,
        height: parseInt(formData.height),
        weight: parseFloat(formData.weight),
        trainingDays: parseInt(formData.trainingDays),
        goal: formData.goal,
        focus: formData.focus,
        neck: formData.neck ? parseFloat(formData.neck) : undefined,
        waist: formData.waist ? parseFloat(formData.waist) : undefined,
        hip: formData.hip && formData.gender === Gender.Female ? parseFloat(formData.hip) : undefined,
      });
    } else {
       setErrors(currentErrors);
    }
  };

  const renderInput = (
    name: keyof FormState, 
    label: string, 
    type: string, 
    placeholder: string, 
    unit?: string,
    tooltipText?: string
  ) => (
    <div className="flex flex-col">
      <label htmlFor={name} className="mb-1 text-sm font-medium text-text-secondary flex items-center">
        {label}
        {tooltipText && (
          <Tooltip text={tooltipText}>
            <InfoIcon />
          </Tooltip>
        )}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          step={type === 'number' ? '0.1' : undefined}
          min={type === 'number' ? '0' : undefined}
          value={formData[name]}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full bg-base-200 border ${errors[name] ? 'border-red-500' : 'border-base-300'} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors`}
        />
        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">{unit}</span>}
      </div>
      {/* // Reservamos espacio para evitar CLS */}
      <div className="mt-1 min-h-[1rem]">
        {errors[name] && <p className="text-red-500 text-xs">{errors[name]}</p>}
      </div>
    </div>
  );

  const renderSelect = (name: keyof FormState, label: string, options: {value: string, label: string}[]) => (
     <div className="flex flex-col">
      <label htmlFor={name} className="mb-1 text-sm font-medium text-text-secondary">{label}</label>
      <select
        id={name}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        className="w-full bg-base-200 border border-base-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary appearance-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="w-full bg-base-200 p-6 md:p-8 rounded-2xl shadow-lg border border-base-300">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderInput('age', 'Edad', 'number', '25', 'años')}
        {renderSelect('gender', 'Sexo', [{value: Gender.Male, label: 'Hombre'}, {value: Gender.Female, label: 'Mujer'}])}
        {renderInput('height', 'Altura', 'number', '175', 'cm')}
        {renderInput('weight', 'Peso', 'number', '75', 'kg')}
        {renderSelect('trainingDays', 'Días de entreno / semana', [
          {value: '1', label: '1 día'}, {value: '2', label: '2 días'}, {value: '3', label: '3 días'},
          {value: '4', label: '4 días'}, {value: '5', label: '5 días'}, {value: '6', label: '6 días'}, {value: '7', label: '7 días'}
        ])}
        {renderSelect('goal', 'Objetivo Principal', [
          {value: Goal.Bulking, label: 'Volumen (Ganar Músculo)'},
          {value: Goal.Cutting, label: 'Definición (Perder Grasa)'},
          {value: Goal.Maintenance, label: 'Mantenimiento'},
        ])}
         {renderSelect('focus', 'Enfoque Principal', [
          {value: Focus.Hypertrophy, label: 'Musculación (Hipertrofia)'},
          {value: Focus.Strength, label: 'Fuerza'},
        ])}

        {/*// OPTIONAL MEASURES START*/}
        <fieldset className="col-span-1 md:col-span-2 lg:col-span-3 mt-4 border-t border-base-300 pt-6">
            <legend className="text-sm font-medium text-text-secondary px-2 -ml-2 flex items-center">
                Medidas opcionales (mejoran % grasa)
                <Tooltip text="Proporcionar estas medidas permite usar el método U.S. Navy, más preciso que el basado en IMC. Si se dejan en blanco, se usará el método de Deurenberg (1991).">
                    <InfoIcon />
                </Tooltip>
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {renderInput('neck', 'Cuello', 'number', '38', 'cm', 'Medir en la base, por debajo de la nuez de Adán, con la cinta horizontal.')}
                {renderInput('waist', 'Cintura', 'number', '80', 'cm', 'Medir en el punto más estrecho del abdomen, generalmente por encima del ombligo y la cresta ilíaca.')}
                {formData.gender === Gender.Female && (
                    renderInput('hip', 'Cadera', 'number', '95', 'cm', 'Medir en el punto más ancho de los glúteos con los pies juntos. [Solo para mujeres]')
                )}
            </div>
            {/* // Reservamos espacio para evitar CLS */}
            <div className="mt-3 min-h-[3rem]">
              {navyValidationWarning && (
                <p className="text-yellow-500 text-xs text-center bg-yellow-900/30 p-2 rounded-md">
                  {navyValidationWarning}
                </p>
              )}
            </div>
        </fieldset>
        {/*// OPTIONAL MEASURES END*/}

      </div>
      <button
        type="submit"
        disabled={!isFormValid || isLoading}
        className="w-full mt-8 bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-500 transition-colors duration-300 disabled:bg-base-300 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analizando y Creando Plan...
          </>
        ) : (
          'Calcular y Generar Plan'
        )}
      </button>
    </form>
  );
};

export default FitnessForm;