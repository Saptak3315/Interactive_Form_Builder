// src/hooks/useFormSubmission.ts
import { useState } from 'react';
import FormStorageService, { type QuestionResponse } from '../services/FormStorageService';
import type { FormState } from '../types/form.types';

export const useFormSubmission = (form: FormState) => {
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const handleQuestionResponse = (questionId: number, answer: any, isValid: boolean) => {
    setResponses(prev => {
      const existingIndex = prev.findIndex(r => r.questionId === questionId);
      const newResponse = { questionId, answer, isValid };
      
      if (existingIndex >= 0) {
        const newResponses = [...prev];
        newResponses[existingIndex] = newResponse;
        return newResponses;
      } else {
        return [...prev, newResponse];
      }
    });
  };
  
  const validateForm = () => {
    // Check if all required questions are answered and valid
    const allValid = form.questions
      .filter(q => q.isRequired)
      .every(q => {
        const response = responses.find(r => r.questionId === q.id);
        return response && response.isValid;
      });
      
    return allValid;
  };
  
  const submitForm = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      if (!validateForm()) {
        setSubmitError('Please complete all required questions correctly.');
        return false;
      }
      
      if (!form.formId) {
        setSubmitError('Form ID is missing.');
        return false;
      }
      
      const submission = {
        id: Date.now(),
        formId: form.formId,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        responses
      };
      
      FormStorageService.saveSubmission(submission);
      return true;
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return {
    responses,
    handleQuestionResponse,
    submitForm,
    isSubmitting,
    submitError,
    validateForm
  };
};