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
      className={`
        mb-3 p-4 bg-white border-2 rounded-lg transition-all duration-200 cursor-pointer select-none block w-full
        hover:border-gray-300 hover:shadow-sm hover:-translate-y-0.5
        ${isActive ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100' : 'border-gray-200'}
      `}
      onClick={() => onSelect(question.id)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-indigo-500 text-base">{index + 1}.</span>
          <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-500 uppercase font-medium tracking-wide">
            {question.type}
          </span>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            className="w-8 h-8 border-none rounded-md cursor-pointer transition-all duration-200 flex items-center justify-center text-sm bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
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
      
      <div className="mb-3 block w-full">
        <div className="text-base text-gray-800 font-medium leading-6 flex items-center gap-1.5">
          {question.content || `Question ${index + 1}`}
          {question.isRequired && <span className="text-red-600 font-semibold">*</span>}
        </div>
        
        {/* Text input preview */}
        {question.type === 'text' && (
          <div className="mt-2.5 w-full block bg-gray-50 bg-opacity-50 p-1.5 rounded-md">
            <input 
              type="text" 
              className="w-full h-9 px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-500 text-sm block shadow-sm"
              disabled 
              placeholder={question.placeholder || "Text input"}
            />
          </div>
        )}
        
        {/* Textarea preview */}
        {question.type === 'textarea' && (
          <div className="mt-2.5 w-full block bg-gray-50 bg-opacity-50 p-1.5 rounded-md">
            <textarea 
              className="w-full h-9 px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-500 text-sm block shadow-sm"
              disabled
              placeholder={question.placeholder || "Text input"}
            />
          </div>
        )}
        
        {/* Question explanation */}
        {question.explanation && (
          <div className="text-sm text-gray-500 mt-1.5 italic">
            {question.explanation}
          </div>
        )}

        {/* Options preview */}
        {question.options && question.options.length > 0 && (
          <div className="mt-2.5 p-3 bg-gray-50 rounded-md border border-gray-100">
            {question.options.slice(0, 3).map((option, optIndex) => (
              <div key={option.id} className="text-sm text-gray-600 my-0.5 py-0.5">
                • {option.content || `Option ${optIndex + 1}`}
              </div>
            ))}
            {question.options.length > 3 && (
              <div className="text-gray-400 italic mt-1.5 text-sm">
                +{question.options.length - 3} more options
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Question metadata */}
      <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-100 pt-2">
        <span className="font-medium">
          {question.points ? `${question.points} pts` : 'No scoring'}
        </span>
        {question.mediaUrl && (
          <span className="flex items-center gap-1">📎 Media attached</span>
        )}
      </div>
    </div>
  );
};

export default QuestionItem;