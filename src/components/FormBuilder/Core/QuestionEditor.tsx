// src/components/FormBuilder/Core/QuestionEditor.tsx

import React, { useState, useEffect } from 'react';
import { useFormContext } from '../../../context/FormContext/FormProvider';
import {
  addQuestion,
  createDefaultQuestion,
  deleteQuestion,
  setActiveQuestion,
  reorderQuestions
} from '../../../context/FormContext/formActions';

const QuestionEditor: React.FC = () => {
  const { state, dispatch } = useFormContext();
  const [dragOver, setDragOver] = useState(false);
  const [draggedQuestion, setDraggedQuestion] = useState<number | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Add an effect to log questions when they change and force re-render
  useEffect(() => {
    console.log("QuestionEditor questions updated:", state.questions);
    setForceUpdate(prev => prev + 1);
  }, [state.questions]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    console.log('Drop event triggered');

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      console.log('Dropped data:', data);

      if (data.type === 'question-type') {
        const orderPosition = state.questions.length;
        const newQuestion = createDefaultQuestion(data.questionType, orderPosition);
        console.log('New question created:', newQuestion);
        dispatch(addQuestion(newQuestion));
        console.log('Question added to state, questions count after adding:', state.questions.length + 1);
        setForceUpdate(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error parsing drop data:', error);
    }
  };

  // Handle question selection
  const handleQuestionSelect = (questionId: number) => {
    dispatch(setActiveQuestion(questionId));
  };

  // Handle question deletion
  const handleQuestionDelete = (questionId: number, questionTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${questionTitle || 'this question'}"?`)) {
      dispatch(deleteQuestion(questionId));
    }
  };

  // Handle question drag start for reordering
  const handleQuestionDragStart = (e: React.DragEvent, questionId: number) => {
    setDraggedQuestion(questionId);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'question-reorder',
      questionId
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle question drop for reordering
  const handleQuestionDrop = (e: React.DragEvent, targetQuestionId: number) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));

      if (data.type === 'question-reorder' && data.questionId !== targetQuestionId) {
        const draggedIndex = state.questions.findIndex(q => q.id === data.questionId);
        const targetIndex = state.questions.findIndex(q => q.id === targetQuestionId);

        if (draggedIndex !== -1 && targetIndex !== -1) {
          const newQuestions = [...state.questions];
          const [draggedQuestion] = newQuestions.splice(draggedIndex, 1);
          newQuestions.splice(targetIndex, 0, draggedQuestion);

          const reorderedQuestions = newQuestions.map((question, index) => ({
            ...question,
            orderPosition: index
          }));

          dispatch(reorderQuestions(reorderedQuestions));
        }
      }
    } catch (error) {
      console.error('Error reordering questions:', error);
    }

    setDraggedQuestion(null);
  };

  const handleQuestionDragEnd = () => {
    setDraggedQuestion(null);
  };

  const renderQuestions = () => {
    console.log("Rendering questions:", state.questions);

    return state.questions.map((question, index) => (
      <div
        key={question.id}
        className={`
          group mb-3 p-4 bg-white border-2 rounded-lg transition-all duration-200 cursor-pointer select-none relative block w-full
          hover:border-gray-300 hover:shadow-sm hover:-translate-y-0.5
          ${state.activeQuestionId === question.id ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100' : 'border-gray-200'}
          ${draggedQuestion === question.id ? 'opacity-50 rotate-1' : ''}
        `}
        onClick={() => handleQuestionSelect(question.id)}
        draggable={true}
        onDragStart={(e) => handleQuestionDragStart(e, question.id)}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => handleQuestionDrop(e, question.id)}
        onDragEnd={handleQuestionDragEnd}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-gray-400 text-sm cursor-grab p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 active:cursor-grabbing">
              ⋮⋮
            </span>
            <span className="font-semibold text-indigo-500 text-base">{index + 1}.</span>
            <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-500 uppercase font-medium tracking-wide">
              {question.type}
            </span>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              className="w-8 h-8 border-none rounded-md cursor-pointer transition-all duration-200 flex items-center justify-center text-sm bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                alert('Duplicate functionality coming soon!');
              }}
              title="Duplicate question"
            >
              📋
            </button>
            <button
              className="w-8 h-8 border-none rounded-md cursor-pointer transition-all duration-200 flex items-center justify-center text-sm bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                handleQuestionDelete(question.id, question.content);
              }}
              title="Delete question"
            >
              🗑️
            </button>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="text-base text-gray-800 font-medium leading-6 flex items-center gap-1.5">
            {question.content || `Question ${index + 1}`}
            {question.isRequired && <span className="text-red-600 font-semibold">*</span>}
          </div>

          {/* Text type specific preview */}
          {question.type === 'text' && (
            <div className="mt-2.5 w-full block bg-gray-50 bg-opacity-50 p-1.5 rounded-md">
              <input
                type="text"
                className="w-full h-9 px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-500 text-sm block shadow-sm"
                disabled
                placeholder={question.placeholder || "Text input field"}
              />
            </div>
          )}

          {question.explanation && (
            <div className="text-sm text-gray-500 mt-1.5 italic">
              {question.explanation}
            </div>
          )}

          {question.options && question.options.length > 0 && (
            <div className="mt-2.5 p-3 bg-gray-50 rounded-md border border-gray-100">
              {question.options.map((option, optIndex) => (
                <div key={option.id} className="text-sm text-gray-600 my-0.5 py-0.5">
                  • {option.content || `Option ${optIndex + 1}`}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-100 pt-2">
          <span className="font-medium">
            {question.points ? `${question.points} pts` : 'No scoring'}
          </span>
          {question.mediaUrl && (
            <span className="flex items-center gap-1">📎 Media attached</span>
          )}
        </div>
      </div>
    ));
  };

  console.log("QuestionEditor rendering with state:", {
    questionsCount: state.questions.length,
    forceUpdate,
    activeQuestionId: state.activeQuestionId
  });

  if (state.questions.length === 0) {
    return (
      <div
        key={`empty-editor-${forceUpdate}`}
        className={`
          flex items-center justify-center h-full transition-all duration-200 border-2 border-dashed rounded-xl bg-gray-50
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center text-slate-600 p-10">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="mb-2 text-slate-800 text-xl font-semibold">Start building your form</h3>
          <p className="mb-5 text-base">Drag question types from the sidebar or click them to add</p>
          <div className="px-6 py-3 bg-blue-50 border border-dashed border-blue-300 rounded-md text-blue-800 font-medium">
            <span>Drop question types here</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key={`editor-${forceUpdate}-${state.questions.length}`}
      className={`
        h-full flex flex-col gap-5 transition-all duration-200
        ${dragOver ? 'bg-blue-50 border-2 border-dashed border-blue-500 rounded-lg' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {renderQuestions()}
      </div>

      <div className="mt-5">
        <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-400 bg-gray-50 transition-all duration-200 flex flex-col items-center gap-3">
          <span>Drop new questions here or</span>
          <button
            className="px-5 py-2.5 bg-indigo-500 text-white border-none rounded-md font-medium cursor-pointer transition-all duration-200 hover:bg-indigo-600 hover:-translate-y-0.5"
            onClick={() => {
              alert('Question type selector coming soon!');
            }}
          >
            + Add Question
          </button>
        </div>
      </div>

      {/* Debug button */}
      <button
        className="absolute bottom-2.5 right-2.5 p-1.5 bg-gray-100 border border-gray-300 rounded text-xs z-25"
        onClick={() => console.log('Current state:', state)}
      >
        Debug State
      </button>
    </div>
  );
};

export default QuestionEditor;