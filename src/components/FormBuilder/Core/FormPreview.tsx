// src/components/FormBuilder/Core/FormPreview.tsx
import Swal from "sweetalert2";
import { useFormContext } from "../../../context/FormContext/FormProvider";
import type { QuestionResponse } from "../../../services/FormStorageService";
import { useState } from "react";

const FormPreview = () => {
  const { state } = useFormContext();
  const [responses, setResponses] = useState<QuestionResponse[]>([]);

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

  const renderQuestion = (question: any, index: number) => {
    console.log(question);
    // Add specific rendering for different question types
    switch (question.type) {
      case 'text':
        return (
          <div key={question.id} className="mb-6 pb-4 border-b border-slate-100 last:border-b-0 last:mb-2 last:pb-0">
            <label className="block text-sm font-semibold text-gray-700 mb-2 leading-relaxed">
              {index + 1}. {question.content || 'Short Text Question'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>

            {renderQuestionMedia(question)}

            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-slate-50 text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder={question.placeholder || "Enter your answer.."}
              disabled={true}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={question.id} className="mb-6 pb-4 border-b border-slate-100 last:border-b-0 last:mb-2 last:pb-0">
            <label className="block text-sm font-semibold text-gray-700 mb-2 leading-relaxed">
              {index + 1}. {question.content || 'Long Text Question'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {question.explanation && (
              <p className="text-xs text-slate-500 italic mb-2">{question.explanation}</p>
            )}

            {renderQuestionMedia(question)}

            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-slate-50 text-slate-500 min-h-16 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder={question.placeholder || "Enter your detailed answer"}
              disabled={true}
              rows={4}
            />
          </div>
        );

      case 'number':
        return (
          <div key={question.id} className="mb-6 pb-4 border-b border-slate-100 last:border-b-0 last:mb-2 last:pb-0">
            <label className="block text-sm font-semibold text-gray-700 mb-2 leading-relaxed">
              {index + 1}. {question.content || 'Number Question'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {question.explanation && (
              <p className="text-xs text-slate-500 italic mb-2">{question.explanation}</p>
            )}

            {renderQuestionMedia(question)}

            <input
              type="number"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-slate-50 text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder={question.placeholder || "Enter a number"}
              disabled={true}
            />
          </div>
        );
        
      case 'email':
        return (
          <div key={question.id} className="mb-6 pb-4 border-b border-slate-100 last:border-b-0 last:mb-2 last:pb-0">
            <label className="block text-sm font-semibold text-gray-700 mb-2 leading-relaxed">
              {index + 1}. {question.content || 'Email Address'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {question.explanation && (
              <p className="text-xs text-slate-500 italic mb-2">{question.explanation}</p>
            )}

            {renderQuestionMedia(question)}

            <input
              type="email"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-slate-50 text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder={question.placeholder || "Enter your email address"}
              disabled={true}
            />
          </div>
        );

      case 'phone':
        return (
          <div key={question.id} className="mb-6 pb-4 border-b border-slate-100 last:border-b-0 last:mb-2 last:pb-0">
            <label className="block text-sm font-semibold text-gray-700 mb-2 leading-relaxed">
              {index + 1}. {question.content || 'Phone Number'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {question.explanation && (
              <p className="text-xs text-slate-500 italic mb-2">{question.explanation}</p>
            )}

            {renderQuestionMedia(question)}

            <input
              type="tel"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-slate-50 text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder={question.placeholder || "Enter your phone number"}
              disabled={true}
            />
          </div>
        );

      case 'address':
        return (
          <div key={question.id} className="mb-6 pb-4 border-b border-slate-100 last:border-b-0 last:mb-2 last:pb-0">
            <label className="block text-sm font-semibold text-gray-700 mb-2 leading-relaxed">
              {index + 1}. {question.content || 'Address'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {question.explanation && (
              <p className="text-xs text-slate-500 italic mb-2">{question.explanation}</p>
            )}

            {renderQuestionMedia(question)}

            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-slate-50 text-slate-500 min-h-16 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder={question.placeholder || "Enter your address"}
              disabled={true}
              rows={3}
            />
          </div>
        );

      case 'full_name':
        return (
          <div key={question.id} className="mb-6 pb-4 border-b border-slate-100 last:border-b-0 last:mb-2 last:pb-0">
            <label className="block text-sm font-semibold text-gray-700 mb-2 leading-relaxed">
              {index + 1}. {question.content || 'Full Name'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {question.explanation && (
              <p className="text-xs text-slate-500 italic mb-2">{question.explanation}</p>
            )}

            {renderQuestionMedia(question)}

            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-slate-50 text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder={question.placeholder || "Enter your full name"}
              disabled={true}
            />
          </div>
        );

      case 'multiple_choice':
        const isMultiSelect = question.mcqSettings?.allowMultipleCorrect || false;
        return (
          <div key={question.id} className="mb-6 pb-4 border-b border-slate-100 last:border-b-0 last:mb-2 last:pb-0">
            <label className="block text-sm font-semibold text-gray-700 mb-2 leading-relaxed">
              {index + 1}. {question.content || 'Multiple Choice Question'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
              {isMultiSelect && <span className="ml-2 text-blue-600 text-xs">(Multi-select)</span>}
            </label>
            {question.explanation && (
              <p className="text-xs text-slate-500 italic mb-2">{question.explanation}</p>
            )}

            {renderQuestionMedia(question)}

            <div className="flex flex-col gap-2">
              {question.options?.map((option: any, optIndex: number) => (
                <div key={option.id} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md">
                  <input
                    type={isMultiSelect ? "checkbox" : "radio"}
                    name={isMultiSelect ? undefined : `question-${question.id}`}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    disabled={true}
                  />
                  <span className="flex-1 text-sm text-slate-700">
                    {option.content || `Option ${String.fromCharCode(65 + optIndex)}`}
                    {question.mcqSettings?.showCorrectAnswers && option.isCorrect && (
                      <span className="ml-2 text-green-600 font-medium">✓</span>
                    )}
                    {option.points && (
                      <span className="ml-2 text-blue-600 text-xs">({option.points} pts)</span>
                    )}
                  </span>
                </div>
              )) || (
                  <div className="text-sm text-slate-400 italic">No options configured</div>
                )}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div key={question.id} className="mb-6 pb-4 border-b border-slate-100 last:border-b-0 last:mb-2 last:pb-0">
            <label className="block text-sm font-semibold text-gray-700 mb-2 leading-relaxed">
              {index + 1}. {question.content || 'Select all that apply'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {question.explanation && (
              <p className="text-xs text-slate-500 italic mb-2">{question.explanation}</p>
            )}

            {renderQuestionMedia(question)}

            <div className="flex flex-col gap-2">
              {question.options?.map((option: any, optIndex: number) => (
                <div key={option.id} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={true}
                  />
                  <span className="flex-1 text-sm text-slate-700">{option.content || `Option ${optIndex + 1}`}</span>
                </div>
              )) || (
                  <div className="text-sm text-slate-400 italic">No options configured</div>
                )}
            </div>
          </div>
        );

      case 'file':
        return (
          <div key={question.id} className="mb-6 pb-4 border-b border-slate-100 last:border-b-0 last:mb-2 last:pb-0">
            <label className="block text-sm font-semibold text-gray-700 mb-2 leading-relaxed">
              {index + 1}. {question.content || 'File Upload Question'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {question.explanation && (
              <p className="text-xs text-slate-500 italic mb-2">{question.explanation}</p>
            )}

            {renderQuestionMedia(question)}

            <div className="flex items-center gap-3 p-3 border border-dashed border-slate-300 rounded-md bg-slate-50">
              <button className="px-3 py-1.5 bg-slate-500 text-white text-xs font-medium rounded border-0 cursor-not-allowed">
                Choose File
              </button>
              <span className="text-xs text-slate-500">No file chosen</span>
            </div>
          </div>
        );
      case 'audio':
        return (
          <div key={question.id} className="mb-6 pb-4 border-b border-slate-100 last:border-b-0 last:mb-2 last:pb-0">
            <label className="block text-sm font-semibold text-gray-700 mb-2 leading-relaxed">
              {index + 1}. {question.content || 'Audio Question'}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {question.explanation && (
              <p className="text-xs text-slate-500 italic mb-2">{question.explanation}</p>
            )}

            {renderQuestionMedia(question)}

            <div className="p-3 border border-slate-300 rounded-md bg-slate-50 text-center">
              <button className="px-4 py-2 bg-slate-500 text-white text-xs font-medium rounded border-0 cursor-not-allowed">
                🎤 Record Audio
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div key={question.id} className="mb-6 pb-4 border-b border-slate-100 last:border-b-0 last:mb-2 last:pb-0">
            <label className="block text-sm font-semibold text-gray-700 mb-2 leading-relaxed">
              {index + 1}. {question.content || `Question ${index + 1}`}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>

            {renderQuestionMedia(question)}

            <p className="text-sm text-slate-400 italic">({question.type})</p>
          </div>
        );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if all required questions are answered and valid
    const allValid = state.questions
      .filter(q => q.isRequired)
      .every(q => {
        const response = responses.find(r => r.questionId === q.id);
        return response && response.isValid;
      });

    if (allValid) {
      console.log('Form submission data:', {
        formId: state.formId,
        responses
      });

      // Here you would call the service to save the submission
      Swal.fire('Form submitted successfully!');
    } else {
      Swal.fire('Please complete all required questions correctly.');
    }
  };

  // Empty state
  if (state.questions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-10">
        <div className="text-6xl mb-6 opacity-40">📝</div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">No questions to preview</h3>
        <p className="text-sm leading-relaxed">Add some questions to your form to see the preview here</p>
      </div>
    );
  }

  return (
    <div className="h-full p-5 bg-slate-50 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* Form Header */}
        <div className="px-5 py-6 bg-slate-50 border-b border-slate-200 text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            {state.title || 'Untitled Form'}
          </h2>
          {state.description && (
            <p className="text-sm text-slate-600 leading-relaxed">
              {state.description}
            </p>
          )}
        </div>

        {/* Form Questions */}
        <div className="p-5">
          <form onSubmit={handleSubmit}>
            {state.questions.map((question, index) => renderQuestion(question, index))}

            {/* Submit Button */}
            <div className="mt-5 pt-4 border-t border-slate-200 text-center">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors cursor-not-allowed"
                disabled={true}
              >
                Submit Form (Preview Mode)
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default FormPreview;