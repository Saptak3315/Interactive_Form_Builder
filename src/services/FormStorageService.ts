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
// Add this interface at the top of the file if not present
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
    form.description = localStorage.getItem("form_description") ?? "";
    form.title = localStorage.getItem("form_name") ?? "";

    const forms = FormStorageService.getForms();

    // Create a copy of the form for storage, removing large media data
    const updatedForm: StoredForm = {
      ...form,
      updatedAt: new Date().toISOString(), // Add updatedAt here
      questions: form.questions.map(question => ({
        ...question,
        // Keep only essential media info, remove large data URLs
        mediaUrl: question.mediaUrl ? (
          question.mediaUrl.startsWith('data:') ? '' : question.mediaUrl
        ) : question.mediaUrl,
        // Keep media type for UI purposes
        mediaType: question.mediaType,
        // Add a flag to indicate media was uploaded
        hasUploadedMedia: question.mediaUrl ? question.mediaUrl.startsWith('data:') : false
      }))
    };

    const existingIndex = forms.findIndex(f => f.formId === form.formId);

    try {
      if (existingIndex >= 0) {
        // Update existing form
        forms[existingIndex] = updatedForm;
      } else {
        // Add new form with generated ID if not present
        if (!updatedForm.formId) {
          updatedForm.formId = Date.now();
        }
        forms.unshift(updatedForm);
      }

      localStorage.setItem(FORMS_KEY, JSON.stringify(forms));

      // Return the original form with the new ID if it was generated
      return {
        ...form,
        formId: updatedForm.formId,
        isFormSaved: true
      };

    } catch (error) {
      console.error('Error saving form to localStorage:', error);

      // If localStorage is full, try to save without any media
      const formWithoutMedia: StoredForm = {
        ...form,
        formId: updatedForm.formId,
        updatedAt: new Date().toISOString(), // Add updatedAt here too
        questions: form.questions.map(question => ({
          ...question,
          mediaUrl: '',
          mediaType: '',
          hasUploadedMedia: false
        }))
      };

      try {
        if (existingIndex >= 0) {
          forms[existingIndex] = formWithoutMedia;
        } else {
          if (!formWithoutMedia.formId) {
            formWithoutMedia.formId = Date.now();
          }
          forms.push(formWithoutMedia);
        }

        localStorage.setItem(FORMS_KEY, JSON.stringify(forms));

        // Show warning to user
        console.warn('Form saved without media files due to storage limitations');

        return {
          ...form,
          formId: formWithoutMedia.formId,
          isFormSaved: true
        };

      } catch (secondError) {
        console.error('Failed to save form even without media:', secondError);
        throw new Error('Unable to save form: Storage limit exceeded');
      }
    }
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

  // Get response count for a specific form
  getResponseCount: (formId: number): number => {
    const submissions = FormStorageService.getSubmissions(formId);
    return submissions.length;
  },

  // Get total response count across all forms
  getTotalResponseCount: (): number => {
    const allSubmissions = FormStorageService.getSubmissions();
    return allSubmissions.length;
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