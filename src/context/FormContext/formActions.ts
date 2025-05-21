// src/context/FormContext/formActions.ts

// Use type-only imports for types
import type { FormAction, Question, QuestionOption, FormState } from '../../types/form.types';

// Helper to generate unique IDs (temporary until backend integration)
export const generateId = (): number => {
  return Math.floor(Math.random() * 100000);
};

// Form actions
export const setForm = (form: Partial<FormState>): FormAction => ({
  type: 'SET_FORM',
  payload: { form },
});

// Question actions
export const addQuestion = (question: Omit<Question, 'id'>): FormAction => ({
  type: 'ADD_QUESTION',
  payload: { 
    question: { 
      ...question, 
      id: generateId(),
    } 
  },
});

export const updateQuestion = (questionId: number, question: Partial<Question>): FormAction => ({
  type: 'UPDATE_QUESTION',
  payload: { questionId, question },
});

export const deleteQuestion = (questionId: number): FormAction => ({
  type: 'DELETE_QUESTION',
  payload: { questionId },
});

export const reorderQuestions = (questions: Question[]): FormAction => ({
  type: 'REORDER_QUESTIONS',
  payload: { questions },
});

export const setActiveQuestion = (questionId: number | null): FormAction => ({
  type: 'SET_ACTIVE_QUESTION',
  payload: { questionId },
});

// Option actions
export const addOption = (questionId: number, option: Omit<QuestionOption, 'id'>): FormAction => ({
  type: 'ADD_OPTION',
  payload: { 
    questionId,
    option: { 
      ...option, 
      id: generateId(),
    } 
  },
});

export const updateOption = (
  questionId: number, 
  optionId: number, 
  option: Partial<QuestionOption>
): FormAction => ({
  type: 'UPDATE_OPTION',
  payload: { questionId, optionId, option },
});

export const deleteOption = (questionId: number, optionId: number): FormAction => ({
  type: 'DELETE_OPTION',
  payload: { questionId, optionId },
});


export const createDefaultQuestion = (
  type: Question['type'], 
  orderPosition: number
): Omit<Question, 'id'> => {
  // Base configuration for all question types
  const baseQuestion = {
    content: '',
    type,
    orderPosition,
    isRequired: false,
    explanation: '',
  };

  // Type-specific configurations
  switch (type) {
    case 'text':
      return {
        ...baseQuestion,
        content: 'New Text Question',
        placeholder: 'Enter your answer here',
      };
    case 'multiple_choice':
    case 'checkbox':
      return {
        ...baseQuestion,
        options: [
          { id: generateId(), content: 'Option 1', orderPosition: 0, isCorrect: false },
          { id: generateId(), content: 'Option 2', orderPosition: 1, isCorrect: false },
        ],
      };
    default:
      return baseQuestion;
  }
};

// Utility action to duplicate a question
export const duplicateQuestion = (question: Question, orderPosition: number): FormAction => {
  const duplicatedQuestion: Question = {
    ...question,
    id: generateId(),
    content: `${question.content} (Copy)`,
    orderPosition,
    options: question.options ? 
      question.options.map(option => ({
        ...option,
        id: generateId(),
      })) : 
      undefined,
  };

  return {
    type: 'ADD_QUESTION',
    payload: { question: duplicatedQuestion },
  };
};