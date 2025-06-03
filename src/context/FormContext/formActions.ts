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
    explanation: ""
  };

  // Type-specific configurations
  switch (type) {
    case 'full_name':
      return {
        ...baseQuestion,
        content: 'Full Name',
        placeholder: 'Enter your full name',
        validationType: 'text',
        validationPattern: '',
        explanation: '',
      };

    case 'address':
      return {
        ...baseQuestion,
        content: 'Address',
        placeholder: 'Enter your address',
        validationType: 'text',
        validationPattern: '',
        maxLength: 320,
        explanation: '',
      };

    case 'email':
      return {
        ...baseQuestion,
        content: 'Email Address',
        placeholder: 'example@email.com',
        validationType: 'email',
        validationPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        errorMessageForPattern: 'Please Enter an email',
        explanation: 'Must be a valid email address',
      };

    case 'phone':
      return {
        ...baseQuestion,
        content: 'Phone Number',
        placeholder: 'Enter your phone number',
        validationType: 'phone',
        validationPattern: '/^\+?[1-9]\d{7,14}$/',
        errorMessageForPattern: 'Please Enter an Phone Number',
        explanation: 'Must be a valid phone number',
      };

    case 'text': // short_text
      return {
        ...baseQuestion,
        content: 'Short Text Question',
        placeholder: 'Enter short text',
        validationType: 'none',
        validationPattern: '',
        explanation: '',
      };

    case 'textarea': // long_text
      return {
        ...baseQuestion,
        content: 'Long Text Question',
        placeholder: 'Enter your detailed answer here',
        validationType: 'none',
        validationPattern: '',
        explanation: '',
      };

    case 'number':
      return {
        ...baseQuestion,
        content: 'Number Question',
        placeholder: 'Enter a number',
        validationType: 'number',
        validationPattern: '',
        explanation: '',
      };

    case 'multiple_choice':
      return {
        ...baseQuestion,
        content: 'Multiple Choice Question',
        points: 1,
        negativePoints: 0,
        mcqSettings: {
          shuffleOptions: false,
          allowMultipleCorrect: false,
          showCorrectAnswers: true,
          partialCredit: false,
          scoringMethod: 'standard',
          defaultPoints: 1,
          defaultNegativePoints: 0,
          minSelections: undefined,
          maxSelections: undefined,
        },
        options: [
          {
            id: generateId(),
            content: 'Option A',
            orderPosition: 0,
            isCorrect: false,
            points: 1,
            negativePoints: 0,
            explanation: ''
          },
          {
            id: generateId(),
            content: 'Option B',
            orderPosition: 1,
            isCorrect: false,
            points: 1,
            negativePoints: 0,
            explanation: ''
          },
          {
            id: generateId(),
            content: 'Option C',
            orderPosition: 2,
            isCorrect: false,
            points: 1,
            negativePoints: 0,
            explanation: ''
          },
          {
            id: generateId(),
            content: 'Option D',
            orderPosition: 3,
            isCorrect: false,
            points: 1,
            negativePoints: 0,
            explanation: ''
          },
        ],
      };

    case 'checkbox':
      return {
        ...baseQuestion,
        content: 'Select all that apply',
        explanation: 'You may choose multiple options',
        options: [
          { id: generateId(), content: 'Option 1', orderPosition: 0, isCorrect: false },
          { id: generateId(), content: 'Option 2', orderPosition: 1, isCorrect: false },
          { id: generateId(), content: 'Option 3', orderPosition: 2, isCorrect: false },
        ],
      };
      
    case 'file':
      return {
        ...baseQuestion,
        content: 'File Upload Question',
      };

    case 'audio':
      return {
        ...baseQuestion,
        content: 'Audio Upload Question',
      };

    case 'calculated':
      return {
        ...baseQuestion,
        content: 'Calculated Field',
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