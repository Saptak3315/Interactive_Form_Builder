// src/components/FormBuilder/Questions/TextQuestionPreview.tsx
import React, { useState } from 'react';
import type { Question } from '../../../types/form.types';

interface TextQuestionPreviewProps {
  question: Question;
  onChange?: (value: string, isValid: boolean) => void;
  value?: string;
}

const TextQuestionPreview: React.FC<TextQuestionPreviewProps> = ({ 
  question, 
  onChange,
  value = ''
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  
  const validateInput = (value: string): boolean => {
    if (question.isRequired && !value.trim()) {
      setError('This field is required');
      return false;
    }
    
    if (question.minLength && value.length < question.minLength) {
      setError(`Minimum length is ${question.minLength} characters`);
      return false;
    }
    
    if (question.maxLength && value.length > question.maxLength) {
      setError(`Maximum length is ${question.maxLength} characters`);
      return false;
    }
    
    if (question.validationPattern && value) {
      try {
        const regex = new RegExp(question.validationPattern);
        if (!regex.test(value)) {
          setError('Input does not match the required format');
          return false;
        }
      } catch (e) {
        console.error('Invalid regex pattern:', e);
      }
    }
    
    setError(null);
    return true;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    const isValid = validateInput(newValue);
    if (onChange) {
      onChange(newValue, isValid);
    }
  };
  
  return (
    <div className="text-question-preview">
      <label className="preview-question-label">
        {question.content}
        {question.isRequired && <span className="preview-required">*</span>}
      </label>
      
      {question.explanation && (
        <p className="preview-question-help">{question.explanation}</p>
      )}
      
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder={question.placeholder || ''}
        className={`preview-input ${error ? 'input-error' : ''}`}
        required={question.isRequired}
        maxLength={question.maxLength}
      />
      
      {error && <div className="input-error-message">{error}</div>}
      
      {question.points && (
        <div className="preview-question-points">{question.points} points</div>
      )}
    </div>
  );
};

export default TextQuestionPreview;