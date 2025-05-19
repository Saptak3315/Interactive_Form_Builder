export type QuestionType = 'text' | 'textarea' | 'multiple_choice' | 'checkbox' | 'file' | 'audio' | 'number' | 'calculated';

export interface QuestionOption {
  id: number;
  content: string;
  orderPosition: number;
  isCorrect?: boolean;
  points?: number;
  mediaUrl?: string;
  mediaType?: string;
}

export interface Question {
  id: number;
  content: string;
  type: QuestionType;
  orderPosition: number;
  isRequired: boolean;
  points?: number;
  mediaUrl?: string;
  mediaType?: string;
  explanation?: string;
  options?: QuestionOption[];
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
  | { type: 'ADD_OPTION'; payload: { questionId: number; option: QuestionOption } }
  | { type: 'UPDATE_OPTION'; payload: { questionId: number; optionId: number; option: Partial<QuestionOption> } }
  | { type: 'DELETE_OPTION'; payload: { questionId: number; optionId: number } }
  | { type: 'SET_ACTIVE_QUESTION'; payload: { questionId: number | null } };