// Updated FormPreview.tsx
import { useFormContext } from "../../../context/FormContext/FormProvider";
import type { QuestionResponse } from "../../../services/FormStorageService";
import TextQuestionPreview from "../Questions/TextQuestionPreview";
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

  const renderQuestion = (question: any, index: number) => {
    // Add specific rendering for different question types
    switch (question.type) {
      case 'text':
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-question-label">
              {index + 1}. {question.content || 'Short Text Question'}
              {question.isRequired && <span className="preview-required">*</span>}
            </label>
            {question.explanation && (
              <p className="preview-question-help">{question.explanation}</p>
            )}
            <input 
              type="text"
              className="preview-input"
              placeholder={question.placeholder || "Enter your answer"}
              disabled={true}
            />
          </div>
        );
      default:
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-question-label">
              {index + 1}. {question.content || `Question ${index + 1}`}
              {question.isRequired && <span className="preview-required">*</span>}
            </label>
            <p className="question-type-note">({question.type})</p>
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
      alert('Form submitted successfully!');
    } else {
      alert('Please complete all required questions correctly.');
    }
  };

  return (
    <div className="form-preview">
      <div className="preview-form">
        <div className="preview-form-header">
          <h2>{state.title}</h2>
          {state.description && <p>{state.description}</p>}
        </div>
        
        <div className="preview-questions">
          {state.questions.length === 0 ? (
            <p className="preview-placeholder">No questions to preview</p>
          ) : (
            state.questions.map((question, index) => renderQuestion(question, index))
          )}
        </div>
      </div>
    </div>
  );
}

export default FormPreview;