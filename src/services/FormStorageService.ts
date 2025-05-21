// src/services/FormStorageService.ts
import type { FormState } from "../types/form.types";

// Keys for localStorage
const FORMS_KEY = 'formcraft_forms';
const SUBMISSIONS_KEY = 'formcraft_submissions';

// Types for the local storage format
interface StoredForm extends FormState {
  updatedAt: string;
}

interface FormSubmission {
  id: number;
  formId: number;
  startedAt: string;
  completedAt: string | null;
  responses: QuestionResponse[];
}

export interface QuestionResponse {
  questionId: number;
  answer: any;
  isValid: boolean;
}

export const FormStorageService = {
  // Form CRUD operations
  getForms: (): FormState[] => {
    const storedForms = localStorage.getItem(FORMS_KEY);
    return storedForms ? JSON.parse(storedForms) : [];
  },
  getFormById: (formId: number): FormState | null => {
    const forms = FormStorageService.getForms();
    return forms.find(form => form.formId === formId) || null;
  },
  
  saveForm: (form: FormState): FormState => {
    const forms = FormStorageService.getForms();
    const updatedForm: StoredForm = {
      ...form,
      updatedAt: new Date().toISOString()
    };
    
    const existingIndex = forms.findIndex(f => f.formId === form.formId);
    
    if (existingIndex >= 0) {
      // Update existing form
      forms[existingIndex] = updatedForm;
    } else {
      // Add new form with generated ID if not present
      if (!updatedForm.formId) {
        updatedForm.formId = Date.now();
      }
      forms.push(updatedForm);
    }
    
    localStorage.setItem(FORMS_KEY, JSON.stringify(forms));
    return updatedForm;
  },
  
  deleteForm: (formId: number): boolean => {
    const forms = FormStorageService.getForms();
    const newForms = forms.filter(form => form.formId !== formId);
    
    if (newForms.length < forms.length) {
      localStorage.setItem(FORMS_KEY, JSON.stringify(newForms));
      return true;
    }
    return false;
  },
  
  // Submission operations
  getSubmissions: (formId?: number): FormSubmission[] => {
    const storedSubmissions = localStorage.getItem(SUBMISSIONS_KEY);
    const submissions: FormSubmission[] = storedSubmissions ? JSON.parse(storedSubmissions) : [];
    
    return formId 
      ? submissions.filter(sub => sub.formId === formId) 
      : submissions;
  },
  
  saveSubmission: (submission: FormSubmission): FormSubmission => {
    const submissions = FormStorageService.getSubmissions();
    
    // Generate ID if not present
    if (!submission.id) {
      submission.id = Date.now();
    }
    
    const existingIndex = submissions.findIndex(s => s.id === submission.id);
    
    if (existingIndex >= 0) {
      // Update existing submission
      submissions[existingIndex] = submission;
    } else {
      // Add new submission
      submissions.push(submission);
    }
    
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
    return submission;
  },
  
  // Helper methods that will be useful when transitioning to API
  createForm: (form: Omit<FormState, 'formId'>): FormState => {
    const newForm: FormState = {
      ...form,
      formId: Date.now()
    };
    return FormStorageService.saveForm(newForm);
  },
  
  updateForm: (form: FormState): FormState => {
    return FormStorageService.saveForm(form);
  }
};

export default FormStorageService;