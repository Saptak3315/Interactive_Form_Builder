// src/types/form.types.ts

export interface Question {
  id: number;
  content: string;
  type: 'text' | 'textarea' | 'multiple_choice' | 'checkbox' | 'file' | 'audio' | 'number' | 'calculated' | 'full_name' | 'email' | 'address' | 'phone';
  orderPosition: number;
  isRequired: boolean;
  points?: number;
  negativePoints?: number; // Add negative marking at question level
  mediaUrl?: string;
  mediaType?: string;
  explanation?: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  errorMessageForMinLength?: string;
  validationType?: string;
  validationPattern?: string;
  options?: QuestionOption[];
  errorMessageForPattern?: string
  errorMessageForMaxLength?: string;
  // MCQ-specific settings
  mcqSettings?: {
    shuffleOptions: boolean;
    allowMultipleCorrect: boolean;
    showCorrectAnswers: boolean;
    partialCredit: boolean;
    scoringMethod: 'standard' | 'negative_marking' | 'no_negative';
    defaultPoints: number;
    defaultNegativePoints: number;
    minSelections?: number;
    maxSelections?: number;
  };
}

export interface QuestionOption {
  id: number;
  content: string;
  orderPosition: number;
  isCorrect: boolean;
  points?: number;
  negativePoints?: number; // Add negative marking support
  explanation?: string; // Add explanation for each option
  mediaUrl?: string;
  mediaType?: string;
}

export interface FormState {
  formId: number | null;
  title: string;
  description: string;
  questions: Question[];
  activeQuestionId: number | null;
  isFormSaved: boolean;
}

export type FormAction =
  | { type: 'SET_FORM'; payload: { form: Partial<FormState> } }
  | { type: 'ADD_QUESTION'; payload: { question: Question } }
  | { type: 'UPDATE_QUESTION'; payload: { questionId: number; question: Partial<Question> } }
  | { type: 'DELETE_QUESTION'; payload: { questionId: number } }
  | { type: 'REORDER_QUESTIONS'; payload: { questions: Question[] } }
  | { type: 'SET_ACTIVE_QUESTION'; payload: { questionId: number | null } }
  | { type: 'ADD_OPTION'; payload: { questionId: number; option: QuestionOption } }
  | { type: 'UPDATE_OPTION'; payload: { questionId: number; optionId: number; option: Partial<QuestionOption> } }
  | { type: 'DELETE_OPTION'; payload: { questionId: number; optionId: number } };