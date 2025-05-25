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
import { PdndDropZone, PdndDraggable } from '../../../utils/pdnd-components';
import { pdndUtils, type PdndData } from '../../../utils/pdnd-core';

const QuestionEditor: React.FC = () => {
  const { state, dispatch } = useFormContext();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Add an effect to log questions when they change and force re-render
  useEffect(() => {
    console.log("QuestionEditor questions updated:", state.questions);
    setForceUpdate(prev => prev + 1);
  }, [state.questions]);

  // Helper function to get file type from media type
  const getFileType = (mediaType?: string): 'image' | 'video' | 'audio' | 'unknown' => {
    if (!mediaType) return 'unknown';
    if (mediaType.startsWith('image/')) return 'image';
    if (mediaType.startsWith('video/')) return 'video';
    if (mediaType.startsWith('audio/')) return 'audio';
    return 'unknown';
  };

  // Component to render media preview in question list
  const renderMediaPreview = (question: any) => {
    if (!question.mediaUrl) return null;

    const fileType = getFileType(question.mediaType);

    return (
      <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
          <span>📎</span>
          <span>Media attached</span>
        </div>
        
        {fileType === 'image' && (
          <img
            src={question.mediaUrl}
            alt="Question media"
            className="w-full h-16 object-cover rounded border"
          />
        )}
        
        {fileType === 'video' && (
          <div className="w-full h-16 bg-gray-200 rounded border flex items-center justify-center">
            <span className="text-xs text-gray-500">🎥 Video</span>
          </div>
        )}
        
        {fileType === 'audio' && (
          <div className="w-full h-16 bg-gray-200 rounded border flex items-center justify-center">
            <span className="text-xs text-gray-500">🎵 Audio</span>
          </div>
        )}
      </div>
    );
  };

  // Handle dropping new question types from sidebar
  const handleQuestionTypeDrop = (data: PdndData) => {
    console.log('PDND: Question type dropped:', data);
    
    if (data.type === 'question-type') {
      const orderPosition = state.questions.length;
      const newQuestion = createDefaultQuestion(data.questionType, orderPosition);
      console.log('PDND: New question created:', newQuestion);
      dispatch(addQuestion(newQuestion));
      setForceUpdate(prev => prev + 1);
    }
  };

  // Handle dropping questions for reordering
  const handleQuestionReorderDrop = (data: PdndData, targetQuestionId: number) => {
    console.log('PDND: Question reorder drop:', data, 'target:', targetQuestionId);
    
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

  // Validate what can be dropped in main editor
  const canDropInEditor = (data: PdndData): boolean => {
    return data.type === 'question-type';
  };

  // Validate what can be dropped on questions (for reordering)
  const canDropOnQuestion = (data: PdndData): boolean => {
    return data.type === 'question-reorder';
  };

  const renderQuestions = () => {
    console.log("Rendering questions:", state.questions);

    return state.questions.map((question, index) => {
      // Create drag data for question reordering
      const questionDragData = pdndUtils.createDragData(
        `question-${question.id}`,
        'question-reorder',
        {
          questionId: question.id,
          questionContent: question.content,
          orderPosition: question.orderPosition
        }
      );

      return (
        <PdndDraggable
          key={question.id}
          dragData={questionDragData}
          className={`
            group mb-3 p-4 bg-white border-2 rounded-lg transition-all duration-200 select-none relative block w-full
            hover:border-gray-300 hover:shadow-sm
            ${state.activeQuestionId === question.id ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100' : 'border-gray-200'}
          `}
        >
          <PdndDropZone
            acceptedTypes={['question-reorder']}
            onItemDrop={(data) => handleQuestionReorderDrop(data, question.id)}
            canDrop={canDropOnQuestion}
            className="w-full"
            minHeight="auto"
          >
            <div onClick={() => handleQuestionSelect(question.id)} className="cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-gray-400 text-sm cursor-grab p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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

                {/* Render media preview */}
                {renderMediaPreview(question)}

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
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    📎 Media attached
                  </span>
                )}
              </div>
            </div>
          </PdndDropZone>
        </PdndDraggable>
      );
    });
  };

  console.log("QuestionEditor rendering with state:", {
    questionsCount: state.questions.length,
    forceUpdate,
    activeQuestionId: state.activeQuestionId
  });

  if (state.questions.length === 0) {
    return (
      <PdndDropZone
        key={`empty-editor-${forceUpdate}`}
        acceptedTypes={['question-type']}
        onItemDrop={handleQuestionTypeDrop}
        canDrop={canDropInEditor}
        className="flex items-center justify-center h-full transition-all duration-200 border-2 border-dashed rounded-xl bg-gray-50"
        minHeight="400px"
      >
        <div className="text-center text-slate-600 p-10">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="mb-2 text-slate-800 text-xl font-semibold">Start building your form</h3>
          <p className="mb-5 text-base">Drag question types from the sidebar or click them to add</p>
          <div className="px-6 py-3 bg-blue-50 border border-dashed border-blue-300 rounded-md text-blue-800 font-medium">
            <span>Drop question types here</span>
          </div>
        </div>
      </PdndDropZone>
    );
  }

  return (
    <div
      key={`editor-${forceUpdate}-${state.questions.length}`}
      className="h-full flex flex-col gap-5 transition-all duration-200"
    >
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {renderQuestions()}
      </div>

      <PdndDropZone
        acceptedTypes={['question-type']}
        onItemDrop={handleQuestionTypeDrop}
        canDrop={canDropInEditor}
        className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-400 bg-gray-50 transition-all duration-200 flex flex-col items-center gap-3"
        minHeight="80px"
      >
        <span>Drop new questions here or</span>
        <button
          className="px-5 py-2.5 bg-indigo-500 text-white border-none rounded-md font-medium cursor-pointer transition-all duration-200 hover:bg-indigo-600 hover:-translate-y-0.5"
          onClick={() => {
            alert('Question type selector coming soon!');
          }}
        >
          + Add Question
        </button>
      </PdndDropZone>
    </div>
  );
};

export default QuestionEditor;