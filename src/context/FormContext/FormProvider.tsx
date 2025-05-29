// src/context/FormContext/FormProvider.tsx

import React, { createContext, useReducer, useContext, useEffect, useCallback } from 'react';
import { formReducer } from './formReducer';
import FormStorageService from '../../services/FormStorageService';
// Use type-only imports for types
import type { FormState, FormAction } from '../../types/form.types';

// Key for current working form in localStorage
const CURRENT_FORM_KEY = 'formcraft_current_form';

// Define initial state
const getInitialState = (): FormState => {
  // Check if we're editing an existing form from dashboard
  const editFormId = localStorage.getItem('formcraft_edit_form_id');
  if (editFormId) {
    try {
      const formId = parseInt(editFormId);
      const existingForm = FormStorageService.getFormById(formId);
      if (existingForm) {
        console.log('Loading existing form for editing:', existingForm);
        // Clear the edit form ID after loading
        localStorage.removeItem('formcraft_edit_form_id');
        
        // Also sync with the individual localStorage items for FormHeader
        if (existingForm.title) localStorage.setItem('form_name', existingForm.title);
        if (existingForm.description) localStorage.setItem('form_description', existingForm.description);
        
        return existingForm;
      }
    } catch (error) {
      console.error('Error loading form for editing:', error);
    }
    // Clear the edit form ID if loading failed
    localStorage.removeItem('formcraft_edit_form_id');
  }

  // Try to load current working form from localStorage
  try {
    const savedCurrentForm = localStorage.getItem(CURRENT_FORM_KEY);
    if (savedCurrentForm) {
      const parsedForm = JSON.parse(savedCurrentForm);
      console.log('Restored current working form from localStorage:', parsedForm);
      return {
        formId: parsedForm.formId || null,
        title: parsedForm.title || 'Untitled Form',
        description: parsedForm.description || '',
        questions: parsedForm.questions || [],
        activeQuestionId: parsedForm.activeQuestionId || null,
        isFormSaved: parsedForm.isFormSaved ?? false,
      };
    }
  } catch (error) {
    console.error('Error loading current form from localStorage:', error);
  }

  // Fallback to default state
  return {
    formId: null,
    title: 'Untitled Form',
    description: '',
    questions: [],
    activeQuestionId: null,
    isFormSaved: true,
  };
};

// Define the context type
type FormContextType = {
  state: FormState;
  dispatch: React.Dispatch<FormAction>;
  saveCurrentForm: () => void;
  clearCurrentForm: () => void;
  loadForm: (formId: number) => void;
  isFormLoading: boolean;
  formVersion: number; // Add version tracking for better re-renders
};

// Create context with a default value
export const FormContext = createContext<FormContextType>({
  state: getInitialState(),
  dispatch: () => {
    // Empty function as placeholder
  },
  saveCurrentForm: () => {},
  clearCurrentForm: () => {},
  loadForm: () => {},
  isFormLoading: false,
  formVersion: 0,
});

// Create provider component
export const FormProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(formReducer, getInitialState());
  const [isFormLoading, setIsFormLoading] = React.useState(false);
  const [formVersion, setFormVersion] = React.useState(0);

  // Increment version when significant state changes occur
  const incrementFormVersion = useCallback(() => {
    setFormVersion(prev => prev + 1);
  }, []);

  // Auto-save to localStorage whenever state changes (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(CURRENT_FORM_KEY, JSON.stringify(state));
        console.log('Auto-saved form to localStorage:', state);
      } catch (error) {
        console.error('Error auto-saving form:', error);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [state]);

  // Manual save function for explicit saves
  const saveCurrentForm = useCallback(async () => {
    try {
      setIsFormLoading(true);
      
      // Save to permanent storage
      const savedForm = FormStorageService.saveForm(state);
      
      // Update the current form state with the saved form ID
      if (state.formId !== savedForm.formId) {
        dispatch({ type: 'SET_FORM', payload: { form: { formId: savedForm.formId } } });
      }
      
      // Mark as saved
      dispatch({ type: 'SET_FORM', payload: { form: { isFormSaved: true } } });
      
      console.log('Form explicitly saved:', savedForm);
      
      // Small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('Error saving form:', error);
      throw error;
    } finally {
      setIsFormLoading(false);
    }
  }, [state]);

  // Clear current form and start fresh
  const clearCurrentForm = useCallback(async () => {
    console.log('Clearing current form...');
    setIsFormLoading(true);
    
    try {
      const freshState: FormState = {
        formId: null,
        title: 'Untitled Form',
        description: '',
        questions: [],
        activeQuestionId: null,
        isFormSaved: true,
      };
      
      // Clear localStorage first
      localStorage.removeItem(CURRENT_FORM_KEY);
      localStorage.removeItem('form_name');
      localStorage.removeItem('form_description');
      
      // Update state
      dispatch({ type: 'SET_FORM', payload: { form: freshState } });
      
      // Increment version to trigger re-initialization of components
      incrementFormVersion();
      
      console.log('Form cleared successfully');
      
      // Small delay to ensure all state updates are processed
      await new Promise(resolve => setTimeout(resolve, 150));
      
    } catch (error) {
      console.error('Error clearing form:', error);
    } finally {
      setIsFormLoading(false);
    }
  }, [incrementFormVersion]);

  // Load an existing form by ID
  const loadForm = useCallback(async (formId: number) => {
    console.log('Loading form:', formId);
    setIsFormLoading(true);
    
    try {
      const form = FormStorageService.getFormById(formId);
      if (form) {
        // Update state
        dispatch({ type: 'SET_FORM', payload: { form } });
        
        // Also update the separate localStorage items used by FormHeader
        if (form.title) localStorage.setItem('form_name', form.title);
        if (form.description) localStorage.setItem('form_description', form.description);
        
        // Increment version to trigger re-initialization
        incrementFormVersion();
        
        console.log('Form loaded successfully:', form);
        
        // Small delay to ensure state updates are processed
        await new Promise(resolve => setTimeout(resolve, 150));
        
      } else {
        console.error('Form not found:', formId);
        throw new Error('Form not found');
      }
    } catch (error) {
      console.error('Error loading form:', error);
      throw error;
    } finally {
      setIsFormLoading(false);
    }
  }, [incrementFormVersion]);

  // Monitor significant state changes that should trigger component re-initialization
  useEffect(() => {
    // Only increment version for significant changes (form creation, loading, clearing)
    // Not for regular question additions/modifications
    const isSignificantChange = (
      state.formId === null && state.questions.length === 0 // New form
    );
    
    if (isSignificantChange) {
      console.log('Significant form state change detected');
      incrementFormVersion();
    }
  }, [state.formId, incrementFormVersion]);

  // Debug logging
  useEffect(() => {
    console.log('FormProvider state updated:', {
      formId: state.formId,
      title: state.title,
      questionsCount: state.questions.length,
      activeQuestionId: state.activeQuestionId,
      isFormSaved: state.isFormSaved,
      formVersion,
      isFormLoading
    });
  }, [state, formVersion, isFormLoading]);

  return (
    <FormContext.Provider value={{ 
      state, 
      dispatch, 
      saveCurrentForm, 
      clearCurrentForm, 
      loadForm,
      isFormLoading,
      formVersion
    }}>
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