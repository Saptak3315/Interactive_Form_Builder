// src/components/FormPreview/FullFormPreview.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormContext } from "../../context/FormContext/FormProvider";
import { useFormSubmission } from "../../hooks/useFormSubmission";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from 'sweetalert2';
import {
  faArrowLeft,
  faEdit,
  faEye,
  faCheckCircle,
  faExclamationTriangle,
  faClipboardList
} from "@fortawesome/free-solid-svg-icons";

const getValidationPattern = (validationType?: string, customPattern?: string): string | null => {
  const patterns: Record<string, string> = {
    email: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    url: "^https?:\\/\\/(?:[\\w-]+\\.)+[a-zA-Z]{2,}(?::\\d+)?(?:\\/[\\w\\-._~:/?#[\\]@!$&'()*+,;=%]*)?$",
    phone: "^\\+?[1-9]\\d{0,14}$",
    number: "^\\d+$",
    alphanumeric: "^[a-zA-Z0-9]+$"
  };

  if (validationType && patterns[validationType]) {
    return patterns[validationType];
  }
  return customPattern || null;
};
const FullFormPreview: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useFormContext();
  const { responses, handleQuestionResponse, submitForm, isSubmitting, submitError, validateForm } = useFormSubmission(state);
  const [showValidation, setShowValidation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: number]: string }>({});

  // Helper function to get file type from media type
  const getFileType = (mediaType?: string): 'image' | 'video' | 'audio' | 'unknown' => {
    if (!mediaType) return 'unknown';
    if (mediaType.startsWith('image/')) return 'image';
    if (mediaType.startsWith('video/')) return 'video';
    if (mediaType.startsWith('audio/')) return 'audio';
    return 'unknown';
  };

  // Component to render question media
  const renderQuestionMedia = (question: any) => {
    if (!question.mediaUrl) return null;

    const fileType = getFileType(question.mediaType);

    return (
      <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        {fileType === 'image' && (
          <img
            src={question.mediaUrl}
            alt="Question media"
            className="max-w-full h-48 object-cover rounded border shadow-sm"
          />
        )}

        {fileType === 'video' && (
          <video
            src={question.mediaUrl}
            controls
            className="max-w-full h-48 rounded border shadow-sm"
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
      </div>
    );
  };

  const validateInput = (question: any, value: string): { isValid: boolean; error?: string } => {
    // Required field check
    if (question.isRequired && (!value || !value.toString().trim())) {
      return { isValid: false, error: 'This field is required' };
    }
    if (!value || !value.toString().trim()) {
      return { isValid: true };
    }

    const stringValue = value.toString();
    if (question.minLength && stringValue.length < question.minLength) {
      return {
        isValid: false,
        error: question.errorMessageForMinLength || `Minimum ${question.minLength} characters required`
      };
    }

    if (question.maxLength && stringValue.length > question.maxLength) {
      return {
        isValid: false,
        error: question.errorMessageForMaxLength || `Maximum ${question.maxLength} characters allowed`
      };
    }

    if (question.type === 'email' && (!question.validationType || question.validationType === 'none')) {
      question = { ...question, validationType: 'email' }; // Create new object instead of mutating
    }
    if (question.validationType && question.validationType !== 'none') {
      const pattern = getValidationPattern(question.validationType, question.validationPattern);
      if (pattern) {
        try {
          const regex = new RegExp(pattern);
          if (!regex.test(stringValue)) {
            return {
              isValid: false,
              error: question.errorMessageForPattern || `Invalid ${question.validationType} format`
            };
          }
        } catch (e) {
          console.error('Invalid regex pattern:', e);
          return { isValid: false, error: 'Invalid validation pattern configured' };
        }
      }
    }

    return { isValid: true };
  };

  // Validate checkbox/multiple choice required fields
  const validateMultipleChoice = (question: any, value: any): { isValid: boolean; error?: string } => {
    if (question.type === 'checkbox') {
      const selectedOptions = Array.isArray(value) ? value : [];
      if (question.isRequired && selectedOptions.length === 0) {
        return { isValid: false, error: 'Please select at least one option' };
      }
    } else if (question.type === 'multiple_choice') {
      const isMultiSelect = question.mcqSettings?.allowMultipleCorrect || false;

      if (isMultiSelect) {
        const selectedOptions = Array.isArray(value) ? value : [];

        // Check required
        if (question.isRequired && selectedOptions.length === 0) {
          return { isValid: false, error: 'Please select at least one option' };
        }

        // Check min selections
        const minSelections = question.mcqSettings?.minSelections;
        if (minSelections && selectedOptions.length < minSelections) {
          return { isValid: false, error: `Please select at least ${minSelections} option(s)` };
        }

        // Check max selections (should not happen due to UI prevention, but good to have)
        const maxSelections = question.mcqSettings?.maxSelections;
        if (maxSelections && selectedOptions.length > maxSelections) {
          return { isValid: false, error: `Please select no more than ${maxSelections} option(s)` };
        }
      } else {
        // Single selection
        if (question.isRequired && (!value || value === '' || value === null || value === undefined)) {
          return { isValid: false, error: 'Please select an option' };
        }
      }
    }
    return { isValid: true };
  };

  // Real-time validation function
  const performValidation = (questionId: number, question: any, value: any) => {
    let validation: { isValid: boolean; error?: string };

    if (question.type === 'text' || question.type === 'textarea' || question.type === 'email' || question.type === 'address' || question.type === 'full_name' || question.type === 'phone') {
      validation = validateInput(question, typeof value === 'string' ? value.trim() : value);
    } else if (question.type === 'multiple_choice' || question.type === 'checkbox') {
      validation = validateMultipleChoice(question, value);
    } else if (question.type === 'file') {
      validation = question.isRequired && !value
        ? { isValid: false, error: 'Please upload a file' }
        : { isValid: true };
    } else {
      const stringValue = typeof value === 'string' ? value.trim() : value;
      validation = question.isRequired && (!stringValue || stringValue === '')
        ? { isValid: false, error: 'This field is required' }
        : { isValid: true };
    }

    // Update validation errors state
    setValidationErrors(prev => ({
      ...prev,
      [questionId]: validation.isValid ? '' : (validation.error || 'Invalid input')
    }));

    return validation;
  };

  const handleInputChange = (questionId: number, question: any, value: any) => {
    // Perform validation
    const validation = performValidation(questionId, question, value);

    // Update the response
    handleQuestionResponse(questionId, value, validation.isValid);
  };

  const renderQuestion = (question: any, index: number) => {
    const response = responses.find(r => r.questionId === question.id);
    const currentValue = response?.answer || '';
    const hasError = showValidation && validationErrors[question.id];

    switch (question.type) {
      case 'text':
        return (
          <div key={question.id} className="mb-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <label className="block text-lg font-semibold text-gray-800 mb-3 leading-relaxed">
              {index + 1}. {question.content || 'Short Text Question'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>

            {question.explanation && (
              <p className="text-sm text-slate-600 mb-4 leading-relaxed bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                💡 {question.explanation}
              </p>
            )}

            {renderQuestionMedia(question)}

            <input
              type="text"
              value={currentValue}
              onChange={(e) => handleInputChange(question.id, question, e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${hasError
                ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-400 focus:border-red-500 focus:ring-red-500'
                : 'border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              placeholder={question.placeholder || "Enter your answer"}
            />

            {hasError && (
              <div className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="flex-shrink-0" />
                <span>{validationErrors[question.id]}</span>
              </div>
            )}
          </div>
        );
      case 'email':
        return (
          <div key={question.id} className="mb-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <label className="block text-lg font-semibold text-gray-800 mb-3 leading-relaxed">
              {index + 1}. {question.content || 'Email Address'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {question.explanation && (
              <p className="text-sm text-slate-600 mb-4 leading-relaxed bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                💡 {question.explanation}
              </p>
            )}

            {renderQuestionMedia(question)}

            <input
              type="email"
              value={currentValue}
              onChange={(e) => handleInputChange(question.id, question, e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${hasError
                ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500'
                : 'border-slate-300 text-slate-700 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              placeholder="Enter your email"
            />

            {hasError && (
              <div className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="flex-shrink-0" />
                <span>{validationErrors[question.id]}</span>
              </div>
            )}
          </div>
        );

      case 'phone':
        return (
          <div key={question.id} className="mb-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <label className="block text-lg font-semibold text-gray-800 mb-3 leading-relaxed">
              {index + 1}. {question.content || 'Phone Number'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {question.explanation && (
              <p className="text-sm text-slate-600 mb-4 leading-relaxed bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                💡 {question.explanation}
              </p>
            )}

            {renderQuestionMedia(question)}

            <input
              type="tel"
              value={currentValue || ''}
              onChange={(e) => handleInputChange(question.id, question, e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${hasError
                ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500'
                : 'border-slate-300 text-slate-700 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              placeholder="Enter your phone number"
            />

            {hasError && (
              <div className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="flex-shrink-0" />
                <span>{validationErrors[question.id]}</span>
              </div>
            )}
          </div>
        );
      case 'address':
        return (
          <div key={question.id} className="mb-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <label className="block text-lg font-semibold text-gray-800 mb-3 leading-relaxed">
              {index + 1}. {question.content || 'Address'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {question.explanation && (
              <p className="text-sm text-slate-600 mb-4 leading-relaxed bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                💡 {question.explanation}
              </p>
            )}

            {renderQuestionMedia(question)}

            <textarea
              value={currentValue || ''}
              onChange={(e) => handleInputChange(question.id, question, e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg text-base resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${hasError
                ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500'
                : 'border-slate-300 text-slate-700 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              placeholder="Enter your address"
            />

            {hasError && (
              <div className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="flex-shrink-0" />
                <span>{validationErrors[question.id]}</span>
              </div>
            )}
          </div>
        );
      case 'full_name':
        return (
          <div key={question.id} className="mb-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <label className="block text-lg font-semibold text-gray-800 mb-3 leading-relaxed">
              {index + 1}. {question.content || 'Full Name'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {question.explanation && (
              <p className="text-sm text-slate-600 mb-4 leading-relaxed bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                💡 {question.explanation}
              </p>
            )}

            {renderQuestionMedia(question)}

            <input
              type="text"
              value={currentValue || ''}
              onChange={(e) => handleInputChange(question.id, question, e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${hasError
                ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500'
                : 'border-slate-300 text-slate-700 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              placeholder="Enter your full name"
            />

            {hasError && (
              <div className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="flex-shrink-0" />
                <span>{validationErrors[question.id]}</span>
              </div>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={question.id} className="mb-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <label className="block text-lg font-semibold text-gray-800 mb-3 leading-relaxed">
              {index + 1}. {question.content || 'Long Text Question'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {question.explanation && (
              <p className="text-sm text-slate-600 mb-4 leading-relaxed bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                💡 {question.explanation}
              </p>
            )}

            {renderQuestionMedia(question)}

            <textarea
              value={currentValue}
              onChange={(e) => handleInputChange(question.id, question, e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg text-base min-h-32 resize-y transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${hasError
                ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-400 focus:border-red-500 focus:ring-red-500'
                : 'border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              placeholder={question.placeholder || "Enter your detailed answer"}
              rows={4}
            />

            {hasError && (
              <div className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="flex-shrink-0" />
                <span>{validationErrors[question.id]}</span>
              </div>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={question.id} className="mb-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <label className="block text-lg font-semibold text-gray-800 mb-3 leading-relaxed">
              {index + 1}. {question.content || 'Number Question'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {question.explanation && (
              <p className="text-sm text-slate-600 mb-4 leading-relaxed bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                💡 {question.explanation}
              </p>
            )}

            {renderQuestionMedia(question)}

            <input
              type="number"
              value={currentValue}
              onChange={(e) => handleInputChange(question.id, question, e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${hasError
                ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-400 focus:border-red-500 focus:ring-red-500'
                : 'border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              placeholder={question.placeholder || "Enter a number"}
            />

            {hasError && (
              <div className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="flex-shrink-0" />
                <span>{validationErrors[question.id]}</span>
              </div>
            )}
          </div>
        );

      case 'multiple_choice':
        const isMultiSelect = question.mcqSettings?.allowMultipleCorrect || false;

        // Proper value initialization based on selection type
        let displayValue, currentMultiValue;
        if (isMultiSelect) {
          currentMultiValue = Array.isArray(currentValue) ? currentValue : [];
          displayValue = currentMultiValue;
        } else {
          displayValue = currentValue || '';
          currentMultiValue = [];
        }

        return (
          <div key={question.id} className="mb-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <label className="block text-lg font-semibold text-gray-800 mb-3 leading-relaxed">
              {index + 1}. {question.content || 'Multiple Choice Question'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
              {isMultiSelect && (
                <span className="ml-2 text-blue-600 text-sm">
                  (Select multiple
                  {question.mcqSettings?.minSelections && ` - min: ${question.mcqSettings.minSelections}`}
                  {question.mcqSettings?.maxSelections && ` - max: ${question.mcqSettings.maxSelections}`}
                  )
                </span>
              )}
            </label>
            {question.explanation && (
              <p className="text-sm text-slate-600 mb-4 leading-relaxed bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                💡 {question.explanation}
              </p>
            )}

            {renderQuestionMedia(question)}

            <div className="flex flex-col gap-3">
              {question.options?.map((option: any, optIndex: number) => (
                <label
                  key={option.id}
                  className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {isMultiSelect ? (
                    <input
                      type="checkbox"
                      checked={currentMultiValue.includes(option.id)}
                      onChange={(e) => {
                        let newValue;
                        if (e.target.checked) {
                          // Check max selections before adding
                          const maxSelections = question.mcqSettings?.maxSelections;
                          if (maxSelections && currentMultiValue.length >= maxSelections) {
                            e.preventDefault();
                            return;
                          }
                          newValue = [...currentMultiValue, option.id];
                        } else {
                          newValue = currentMultiValue.filter(id => id !== option.id);
                        }
                        handleInputChange(question.id, question, newValue);
                      }}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-1"
                    />
                  ) : (
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option.id}
                      checked={parseInt(displayValue) === option.id}
                      onChange={(e) => handleInputChange(question.id, question, parseInt(e.target.value))}
                      className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500 mt-1"
                    />
                  )}
                  <div className="flex-1">
                    <span className="text-base text-slate-700 block mb-1">
                      {String.fromCharCode(65 + optIndex)}. {option.content || `Option ${optIndex + 1}`}
                    </span>
                    {option.explanation && (
                      <p className="text-sm text-slate-500 italic mb-2">
                        📝 {option.explanation}
                      </p>
                    )}
                    {(option.points || option.negativePoints) && (
                      <div className="flex items-center gap-2 mt-2">
                        {option.points && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                            +{option.points} pts
                          </span>
                        )}
                        {option.negativePoints > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
                            -{option.negativePoints} pts (if wrong)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </label>
              )) || (
                  <div className="text-base text-slate-400 italic">No options configured</div>
                )}
            </div>

            {/* Selection limit feedback */}
            {isMultiSelect && question.mcqSettings?.maxSelections &&
              currentMultiValue.length >= question.mcqSettings.maxSelections && (
                <div className="mt-3 text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-md px-3 py-2">
                  ⚠️ Maximum selections reached ({question.mcqSettings.maxSelections})
                </div>
              )}

            {hasError && (
              <div className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="flex-shrink-0" />
                <span>{validationErrors[question.id]}</span>
              </div>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={question.id} className="mb-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <label className="block text-lg font-semibold text-gray-800 mb-3 leading-relaxed">
              {index + 1}. {question.content || 'Checkbox Question'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {question.explanation && (
              <p className="text-sm text-slate-600 mb-4 leading-relaxed bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                💡 {question.explanation}
              </p>
            )}

            {renderQuestionMedia(question)}

            <div className="flex flex-col gap-3">
              {question.options?.map((option: any, optIndex: number) => {
                const selectedOptions = Array.isArray(currentValue) ? currentValue : [];
                return (
                  <div key={option.id} className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOptions.includes(option.id)}
                      onChange={(e) => {
                        const current = Array.isArray(currentValue) ? currentValue : [];
                        const newValue = e.target.checked
                          ? [...current, option.id]
                          : current.filter(id => id !== option.id);
                        handleInputChange(question.id, question, newValue);
                      }}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="flex-1 text-base text-slate-700">{option.content || `Option ${optIndex + 1}`}</span>
                  </div>
                );
              }) || (
                  <div className="text-base text-slate-400 italic">No options configured</div>
                )}
            </div>

            {hasError && (
              <div className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="flex-shrink-0" />
                <span>{validationErrors[question.id]}</span>
              </div>
            )}
          </div>
        );

      case 'file':
        return (
          <div key={question.id} className="mb-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <label className="block text-lg font-semibold text-gray-800 mb-3 leading-relaxed">
              {index + 1}. {question.content || 'File Upload Question'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {question.explanation && (
              <p className="text-sm text-slate-600 mb-4 leading-relaxed bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                💡 {question.explanation}
              </p>
            )}

            {renderQuestionMedia(question)}

            <div className="flex items-center gap-4 p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50">
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  handleInputChange(question.id, question, file);
                }}
                className="flex-1 text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            {hasError && (
              <div className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="flex-shrink-0" />
                <span>{validationErrors[question.id]}</span>
              </div>
            )}
          </div>
        );

      case 'audio':
        return (
          <div key={question.id} className="mb-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <label className="block text-lg font-semibold text-gray-800 mb-3 leading-relaxed">
              {index + 1}. {question.content || 'Audio Question'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {question.explanation && (
              <p className="text-sm text-slate-600 mb-4 leading-relaxed bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                💡 {question.explanation}
              </p>
            )}

            {renderQuestionMedia(question)}

            <div className="p-6 border border-slate-300 rounded-lg bg-slate-50 text-center">
              <button className="px-6 py-3 bg-indigo-600 text-white text-base font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                🎤 Record Audio
              </button>
            </div>

            {hasError && (
              <div className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="flex-shrink-0" />
                <span>{validationErrors[question.id]}</span>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div key={question.id} className="mb-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <label className="block text-lg font-semibold text-gray-800 mb-3 leading-relaxed">
              {index + 1}. {question.content || `Question ${index + 1}`}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>

            {renderQuestionMedia(question)}

            <p className="text-base text-slate-400 italic">({question.type})</p>
          </div>
        );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);

    // Validate all questions
    let hasErrors = false;
    const newErrors: { [key: number]: string } = {};

    state.questions.forEach(question => {
      const response = responses.find(r => r.questionId === question.id);
      const value = response?.answer || '';

      let validation: { isValid: boolean; error?: string };

      if (question.type === 'text' || question.type === 'textarea' || question.type === 'email' || question.type === 'address' || question.type === 'full_name' || question.type === 'phone') {
        validation = validateInput(question, typeof value === 'string' ? value.trim() : value);
      } else if (question.type === 'multiple_choice' || question.type === 'checkbox') {
        validation = validateMultipleChoice(question, value);
      } else if (question.type === 'file') {
        validation = question.isRequired && !value
          ? { isValid: false, error: 'Please upload a file' }
          : { isValid: true };
      } else {
        const stringValue = typeof value === 'string' ? value.trim() : value;
        validation = question.isRequired && (!stringValue || stringValue === '')
          ? { isValid: false, error: 'This field is required' }
          : { isValid: true };
      }

      if (!validation.isValid) {
        hasErrors = true;
        newErrors[question.id] = validation.error || 'Invalid input';
      }
    });

    setValidationErrors(newErrors);

    if (!hasErrors) {
      try {
        const success = await submitForm();
        if (success) {
          Swal.fire("Success!", "Form submitted successfully!", "success");
          navigate('/');
        } else {
          Swal.fire("Error", "Form submission failed. Please try again.", "error");
        }
      } catch (error) {
        console.error('Submission error:', error);
        Swal.fire("Error", "An unexpected error occurred.", "error");
      }
    } else {
      Swal.fire("Validation Error", "Please complete all required questions correctly.", "error");
    }

  };

  const handleBackToBuilder = () => {
    navigate('/form-builder');
  };

  // Empty state
  if (state.questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToBuilder}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  <span>Back to Builder</span>
                </button>
                <div className="h-6 w-px bg-slate-300"></div>
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faEye} className="text-indigo-600" />
                  <h1 className="text-2xl font-bold text-slate-800">Form Preview</h1>
                </div>
              </div>
              <button
                onClick={handleBackToBuilder}
                className="flex items-center gap-2 px-4 py-2 text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <FontAwesomeIcon icon={faEdit} />
                Edit Form
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center text-slate-500 p-16">
            <div className="text-6xl mb-6 opacity-40">📝</div>
            <h3 className="text-2xl font-semibold text-slate-700 mb-4">No questions to preview</h3>
            <p className="text-lg leading-relaxed mb-8">Add some questions to your form to see the preview here</p>
            <button
              onClick={handleBackToBuilder}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              <FontAwesomeIcon icon={faEdit} className="mr-2" />
              Add Questions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToBuilder}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                <span>Back to Builder</span>
              </button>
              <div className="h-6 w-px bg-slate-300"></div>
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faEye} className="text-indigo-600" />
                <h1 className="text-2xl font-bold text-slate-800">Form Preview</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowValidation(!showValidation)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${showValidation
                  ? 'bg-orange-50 border-orange-300 text-orange-700'
                  : 'bg-slate-50 border-slate-300 text-slate-600'
                  }`}
              >
                <FontAwesomeIcon icon={showValidation ? faCheckCircle : faExclamationTriangle} />
                {showValidation ? 'Hide Validation' : 'Show Validation'}
              </button>
              <button
                onClick={handleBackToBuilder}
                className="flex items-center gap-2 px-4 py-2 text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <FontAwesomeIcon icon={faEdit} />
                Edit Form
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg">
          {/* Form Header */}
          <div className="px-8 py-8 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-slate-200 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FontAwesomeIcon icon={faClipboardList} className="text-3xl text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-3">
              {state.title || 'Untitled Form'}
            </h2>
            {state.description && (
              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                {state.description}
              </p>
            )}
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faClipboardList} />
                {state.questions.length} Questions
              </span>
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faEye} />
                Preview Mode
              </span>
            </div>
          </div>

          {/* Form Questions */}
          <div className="p-8">
            <form onSubmit={handleSubmit}>
              {state.questions.map((question, index) => renderQuestion(question, index))}

              {/* Submit Button */}
              <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 ${isSubmitting
                    ? 'bg-slate-400 text-slate-200 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-lg hover:shadow-xl'
                    }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Form'}
                </button>

                {submitError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                    {submitError}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullFormPreview;

function swal(arg0: string, arg1: string, arg2: string) {
  throw new Error("Function not implemented.");
}
