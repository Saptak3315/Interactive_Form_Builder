// src/components/FormBuilder/Core/QuestionItem.tsx
import React from 'react';
import type { Question } from '../../../types/form.types';

interface QuestionItemProps {
  question: Question;
  index: number;
  isActive: boolean;
  onSelect: (id: number) => void;
  onDelete: (id: number, title: string) => void;
}

const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  index,
  isActive,
  onSelect,
  onDelete
}) => {
  return (
    <div 
      className={`question-item ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(question.id)}
    >
      <div className="question-item-header">
        <div className="question-left">
          <span className="question-number">{index + 1}.</span>
          <span className="question-type-badge">{question.type}</span>
        </div>
        <div className="question-actions">
          <button
            className="question-action-btn delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(question.id, question.content);
            }}
            title="Delete question"
          >
            🗑️
          </button>
        </div>
      </div>
      <div className="question-content">
        <div className="question-text">
          {question.content || `Question ${index + 1}`}
          {question.isRequired && <span className="required-indicator">*</span>}
        </div>
        
        {/* Render based on question type */}
        {question.type === 'text' && (
          <div className="text-preview">
            <input 
              type="text" 
              className="text-preview-input" 
              disabled 
              placeholder={question.placeholder || "Text input"}
            />
          </div>
        )}
        
        {question.type === 'textarea' && (
          <div className="text-preview">
            <textarea 
              className="text-preview-input" 
              disabled
              placeholder={question.placeholder || "Text input"}
            />
          </div>
        )}
        {/* Add other question type previews here */}
      </div>
    </div>
  );
};

export default QuestionItem;