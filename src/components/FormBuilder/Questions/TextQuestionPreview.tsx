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
  
  // Helper function to get file type from media type
  const getFileType = (mediaType?: string): 'image' | 'video' | 'audio' | 'unknown' => {
    if (!mediaType) return 'unknown';
    if (mediaType.startsWith('image/')) return 'image';
    if (mediaType.startsWith('video/')) return 'video';
    if (mediaType.startsWith('audio/')) return 'audio';
    return 'unknown';
  };

  // Component to render question media
  const renderQuestionMedia = () => {
    if (!question.mediaUrl) return null;

    const fileType = getFileType(question.mediaType);

    return (
      <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-md">
        {fileType === 'image' && (
          <img
            src={question.mediaUrl}
            alt="Question media"
            className="max-w-full h-40 object-cover rounded border"
          />
        )}
        
        {fileType === 'video' && (
          <video
            src={question.mediaUrl}
            controls
            className="max-w-full h-40 rounded border"
          >
            Your browser does not support video playback.
          </video>
        )}
        
        {fileType === 'audio' && (
          <audio
            src={question.mediaUrl}
            controls
            className="w-full"
          >
            Your browser does not support audio playback.
          </audio>
        )}
        
        {/* {fileType === 'unknown' && question.mediaUrl && (
          <div className="text-sm text-slate-500 italic">
            📎 Media file attached
          </div>
        )} */}
      </div>
    );
  };
  
  const getValidationPattern = (validationType?: string): string | null => {
    const patterns: Record<string, string> = {
      email: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      url: "^https?:\\/\\/(?:[-\\w.])+(?:\\:[0-9]+)?(?:\\/(?:[\\w\\/_.])*(?:\\?(?:[\\w&=%.])*)?(?:\\#(?:[\\w.])*)?)?$",
      phone: "^[\\+]?[1-9][\\d]{0,15}$",
      number: "^\\d+$",
      alphanumeric: "^[a-zA-Z0-9]+$",
    };

    if (validationType && patterns[validationType]) {
      return patterns[validationType];
    }
    
    return question.validationPattern || null;
  };

  const getValidationMessage = (validationType?: string): string => {
    const messages: Record<string, string> = {
      email: "Please enter a valid email address",
      url: "Please enter a valid URL (e.g., https://example.com)",
      phone: "Please enter a valid phone number",
      number: "Please enter numbers only",
      alphanumeric: "Please enter letters and numbers only",
    };

    return messages[validationType || ''] || "Input does not match the required format";
  };
  
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
    
    // Use validation type or custom pattern
    const pattern = getValidationPattern(question.validationType);
    if (pattern && value) {
      try {
        const regex = new RegExp(pattern);
        if (!regex.test(value)) {
          setError(getValidationMessage(question.validationType));
          return false;
        }
      } catch (e) {
        console.error('Invalid regex pattern:', e);
        setError('Invalid validation pattern configured');
        return false;
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

  const getInputType = (): string => {
    switch (question.validationType) {
      case 'email':
        return 'email';
      case 'url':
        return 'url';
      case 'phone':
        return 'tel';
      case 'number':
        return 'number';
      default:
        return 'text';
    }
  };
  
  return (
    <div className="mb-6 pb-4 border-b border-slate-100 last:border-b-0 last:mb-2 last:pb-0">
      <label className="block text-sm font-semibold text-gray-700 mb-2 leading-relaxed">
        {question.content}
        {question.isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {question.explanation && (
        <p className="text-xs text-slate-500 italic mb-2 leading-relaxed">
          {question.explanation}
        </p>
      )}
      
      {/* Render media if present */}
      {renderQuestionMedia()}
      
      <input
        type={getInputType()}
        value={inputValue}
        onChange={handleChange}
        placeholder={question.placeholder || ''}
        className={`w-full px-3 py-2 border rounded-md text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
          error 
            ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-400 focus:border-red-500 focus:ring-red-500' 
            : 'border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500'
        }`}
        required={question.isRequired}
        maxLength={question.maxLength}
      />
      
      {/* Validation hint */}
      {question.validationType && question.validationType !== 'none' && !error && (
        <div className="text-xs text-slate-500 mt-1">
          {question.validationType === 'email' && 'Enter a valid email address'}
          {question.validationType === 'url' && 'Enter a valid URL (e.g., https://example.com)'}
          {question.validationType === 'phone' && 'Enter a valid phone number'}
          {question.validationType === 'number' && 'Numbers only'}
          {question.validationType === 'alphanumeric' && 'Letters and numbers only'}
        </div>
      )}
      
      {/* Character count indicator */}
      {(question.minLength || question.maxLength) && (
        <div className="flex justify-between items-center mt-1">
          <div className="text-xs text-slate-500">
            {question.minLength && (
              <span>Min: {question.minLength} chars</span>
            )}
            {question.minLength && question.maxLength && <span className="mx-2">•</span>}
            {question.maxLength && (
              <span>Max: {question.maxLength} chars</span>
            )}
          </div>
          {question.maxLength && (
            <div className={`text-xs font-medium ${
              inputValue.length > question.maxLength 
                ? 'text-red-500' 
                : inputValue.length > question.maxLength * 0.8 
                  ? 'text-orange-500' 
                  : 'text-slate-400'
            }`}>
              {inputValue.length}/{question.maxLength}
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div className="flex items-center gap-1.5 mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {question.points && (
        <div className="text-xs text-slate-500 font-medium text-right mt-2">
          {question.points} points
        </div>
      )}
    </div>
  );
};

export default TextQuestionPreview;