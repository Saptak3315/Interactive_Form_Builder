// src/context/FormContext/FormProvider.tsx

import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { formReducer } from './formReducer';
// Use type-only imports for types
import type { FormState, FormAction } from '../../types/form.types';

// Define initial state
const initialState: FormState = {
  formId: null,
  title: 'Untitled Form',
  description: '',
  questions: [],
  activeQuestionId: null,
  isFormSaved: true,
};

// Define the context type
type FormContextType = {
  state: FormState;
  dispatch: React.Dispatch<FormAction>;
};

// Create context with a default value
export const FormContext = createContext<FormContextType>({
  state: initialState,
  dispatch: () => {
    // Empty function as placeholder
  },
});

// Create provider component
export const FormProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(formReducer, initialState);

  useEffect(() => {
    console.log('FormProvider state updated:', state);
  }, [state]);

  return (
    <FormContext.Provider value={{ state, dispatch }}>
      {children}
    </FormContext.Provider>
  );
};

// Custom hook for accessing the form context
export const useFormContext = (): FormContextType => {
  const context = useContext(FormContext);
  
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  
  return context;
};