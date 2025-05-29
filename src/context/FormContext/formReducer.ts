// src/context/FormContext/formReducer.ts
import type { FormState, FormAction } from '../../types/form.types';

export const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_FORM':
      return { ...state, ...action.payload.form };

    case 'ADD_QUESTION': {
      console.log('Reducer: Adding question', action.payload.question);
      const newQuestions = [...state.questions, action.payload.question];
      console.log('Reducer: New questions array:', newQuestions);
      return {
        ...state,
        questions: newQuestions,
        activeQuestionId: action.payload.question.id,
        isFormSaved: false,
      };
    }

    case 'UPDATE_QUESTION':
      return {
        ...state,
        questions: state.questions.map(question =>
          question.id === action.payload.questionId
            ? { ...question, ...action.payload.question }
            : question
        ),
        isFormSaved: false,
      };

    case 'DELETE_QUESTION': {
      const filteredQuestions = state.questions.filter(
        question => question.id !== action.payload.questionId
      );
      // Set a new active question if the deleted one was active
      let newActiveId = state.activeQuestionId;
      if (state.activeQuestionId === action.payload.questionId) {
        newActiveId = filteredQuestions.length > 0 ? filteredQuestions[0].id : null;
      }

      return {
        ...state,
        questions: filteredQuestions,
        activeQuestionId: newActiveId,
        isFormSaved: false,
      };
    }

    case 'REORDER_QUESTIONS':
      return {
        ...state,
        questions: action.payload.questions,
        isFormSaved: false,
      };

    case 'ADD_OPTION': {
      return {
        ...state,
        questions: state.questions.map(question =>
          question.id === action.payload.questionId
            ? {
              ...question,
              options: [...(question.options || []), action.payload.option]
            }
            : question
        ),
        isFormSaved: false,
      };
    }

    case 'UPDATE_OPTION': {
      return {
        ...state,
        questions: state.questions.map(question =>
          question.id === action.payload.questionId && question.options
            ? {
              ...question,
              options: question.options.map(option =>
                option.id === action.payload.optionId
                  ? { ...option, ...action.payload.option }
                  : option
              )
            }
            : question
        ),
        isFormSaved: false,
      };
    }

    case 'DELETE_OPTION': {
      return {
        ...state,
        questions: state.questions.map(question =>
          question.id === action.payload.questionId && question.options
            ? {
              ...question,
              options: question.options.filter(option => option.id !== action.payload.optionId)
            }
            : question
        ),
        isFormSaved: false,
      };
    }

    case 'SET_ACTIVE_QUESTION':
      return {
        ...state,
        activeQuestionId: action.payload.questionId,
      };

    default:
      return state;
  }
};