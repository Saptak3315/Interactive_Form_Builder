// src/components/FormBuilder/Core/QuestionEditor.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFormContext } from '../../../context/FormContext/FormProvider';
import {
  addQuestion,
  createDefaultQuestion,
  deleteQuestion,
  setActiveQuestion,
  reorderQuestions
} from '../../../context/FormContext/formActions';
import { 
  QuestionCard, 
  isQuestionCardData, 
  isQuestionDropTargetData, 
  isNewQuestionTypeData,
  isDraggingAQuestion
} from './QuestionCard';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import Swal from 'sweetalert2';

const QuestionEditor: React.FC = () => {
  const { state, dispatch } = useFormContext();
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  
  // FIXED: Only track new question drops - no reorder state
  const [isNewQuestionDragActive, setIsNewQuestionDragActive] = useState(false);
  const [recentlyAddedQuestionId, setRecentlyAddedQuestionId] = useState<number | null>(null);

  // Debounced add question
  const addQuestionDebounced = useCallback((questionType: string, insertIndex?: number) => {
    const orderPosition = insertIndex !== undefined ? insertIndex : state.questions.length;
    const newQuestion = createDefaultQuestion(questionType as any, orderPosition);
    const newQuestionId = Math.floor(Math.random() * 100000);
    
    if (insertIndex !== undefined) {
      const newQuestions = [...state.questions];
      const questionWithId = { ...newQuestion, id: newQuestionId };
      newQuestions.splice(insertIndex, 0, questionWithId);
      
      const reorderedQuestions = newQuestions.map((question, index) => ({
        ...question,
        orderPosition: index
      }));
      
      dispatch(reorderQuestions(reorderedQuestions));
      dispatch(setActiveQuestion(newQuestionId));
    } else {
      const questionWithId = { ...newQuestion, id: newQuestionId };
      dispatch(addQuestion(questionWithId));
    }
    
    setRecentlyAddedQuestionId(newQuestionId);
    setTimeout(() => setRecentlyAddedQuestionId(null), 500);
  }, [state.questions, dispatch]);

  // Auto-scroll setup
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    return autoScrollForElements({
      element: scrollContainer,
      canScroll: ({ source }) => isDraggingAQuestion({ source }),
      getAllowedAxis: () => 'vertical',
    });
  }, []);

  // FIXED: Single monitor like SingleColumnBoard.tsx pattern
  useEffect(() => {
    return monitorForElements({
      canMonitor: isDraggingAQuestion,
      onDragStart({ source }) {
        // Only track new questions for UI state
        if (isNewQuestionTypeData(source.data)) {
          setIsNewQuestionDragActive(true);
        }
      },
      onDrop({ source, location }) {
        // Reset UI state first
        if (isNewQuestionTypeData(source.data)) {
          setIsNewQuestionDragActive(false);
        }

        const dragging = source.data;

        // Handle new question drops
        if (isNewQuestionTypeData(dragging)) {
          const isDropZoneDrop = location.current.dropTargets.some(target => 
            target.element === dropZoneRef.current
          );
          
          if (isDropZoneDrop) {
            addQuestionDebounced(dragging.questionType);
            return;
          }
          
          // Handle insertion between questions
          const targetDropData = location.current.dropTargets.find(target => 
            isQuestionDropTargetData(target.data)
          );
          
          if (targetDropData && isQuestionDropTargetData(targetDropData.data)) {
            const targetQuestion = targetDropData.data.question;
            const targetIndex = state.questions.findIndex(q => q.id === targetQuestion.id);
            const closestEdge = extractClosestEdge(targetDropData.data);
            
            let insertIndex = targetIndex;
            if (closestEdge === 'bottom') {
              insertIndex = targetIndex + 1;
            }
            
            addQuestionDebounced(dragging.questionType, insertIndex);
          }
          return;
        }

        // Handle question reordering - no state updates, just reorder
        if (isQuestionCardData(dragging)) {
          const innerMost = location.current.dropTargets[0];
          if (!innerMost) return;

          const dropTargetData = innerMost.data;
          if (!isQuestionDropTargetData(dropTargetData)) return;

          const startIndex = state.questions.findIndex(q => q.id === dragging.question.id);
          const finishIndex = state.questions.findIndex(q => q.id === dropTargetData.question.id);

          if (startIndex === -1 || finishIndex === -1 || startIndex === finishIndex) return;

          const closestEdge = extractClosestEdge(dropTargetData);
          const reordered = reorderWithEdge({
            axis: 'vertical',
            list: state.questions,
            startIndex,
            indexOfTarget: finishIndex,
            closestEdgeOfTarget: closestEdge,
          });

          const reorderedWithPositions = reordered.map((question, index) => ({
            ...question,
            orderPosition: index
          }));

          dispatch(reorderQuestions(reorderedWithPositions));
        }
      },
    });
  }, [state.questions, addQuestionDebounced]);

  // Drop zone setup
  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    return dropTargetForElements({
      element: dropZone,
      canDrop: ({ source }) => isNewQuestionTypeData(source.data),
      getData: () => ({ dropZone: true }),
    });
  }, []);

  const handleQuestionSelect = useCallback((questionId: number) => {
    dispatch(setActiveQuestion(questionId));
  }, [dispatch]);

  const handleQuestionDelete = useCallback((questionId: number, questionTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${questionTitle || 'this question'}"?`)) {
      dispatch(deleteQuestion(questionId));
    }
  }, [dispatch]);

  const handleAddQuestionClick = () => {
    const questionTypes = [
      { type: 'text', label: 'Short Text' },
      { type: 'textarea', label: 'Long Text' },
      { type: 'number', label: 'Number' },
      { type: 'multiple_choice', label: 'Multiple Choice' },
      { type: 'checkbox', label: 'Checkboxes' },
      { type: 'file', label: 'File Upload' },
      { type: 'audio', label: 'Audio' },
    ];

    Swal.fire({
      title: 'Select Question Type',
      input: 'select',
      inputOptions: questionTypes.reduce((acc, qt) => {
        acc[qt.type] = qt.label;
        return acc;
      }, {} as Record<string, string>),
      inputPlaceholder: 'Choose a question type',
      showCancelButton: true,
      confirmButtonText: 'Add Question',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'Please select a question type';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        addQuestionDebounced(result.value);
      }
    });
  };

  if (state.questions.length === 0) {
    return (
      <div 
        ref={dropZoneRef}
        className={`
          flex items-center justify-center h-full border-2 border-dashed rounded-xl transition-all duration-200
          ${isNewQuestionDragActive
            ? 'bg-blue-50 border-blue-400 shadow-inner' 
            : 'bg-gray-50 hover:bg-blue-50 hover:border-blue-300 border-gray-300'
          }
        `}
        style={{ minHeight: "400px" }}
      >
        <div className="text-center text-slate-600 p-10">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="mb-2 text-slate-800 text-xl font-semibold">
            {isNewQuestionDragActive ? 'Drop here to add question!' : 'Start building your form'}
          </h3>
          <p className="mb-5 text-base">
            {isNewQuestionDragActive
              ? 'Release to add question to your form' 
              : 'Drag question types from the sidebar or click them to add'
            }
          </p>
          <div className={`
            px-6 py-3 border border-dashed rounded-md font-medium transition-all duration-200
            ${isNewQuestionDragActive
              ? 'bg-blue-100 border-blue-400 text-blue-800'
              : 'bg-blue-50 border-blue-300 text-blue-800'
            }
          `}>
            <span>Drop question types here</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-5">
      <div 
        ref={scrollContainerRef}
        className="flex-1 flex flex-col gap-3 overflow-y-auto"
      >
        {state.questions.map((question, index) => (
          <div 
            key={question.id}
            className={recentlyAddedQuestionId === question.id ? 'animate-pulse' : ''}
          >
            <QuestionCard
              question={question}
              index={index}
              isActive={state.activeQuestionId === question.id}
              onSelect={handleQuestionSelect}
              onDelete={handleQuestionDelete}
            />
          </div>
        ))}
      </div>

      <div
        ref={dropZoneRef}
        className={`
          p-6 border-2 border-dashed rounded-lg text-center flex flex-col items-center gap-3 transition-all duration-200
          ${isNewQuestionDragActive
            ? 'border-blue-400 bg-blue-50 text-blue-700' 
            : 'border-gray-300 bg-gray-50 text-gray-400 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600'
          }
        `}
        style={{ minHeight: "80px" }}
      >
        <span className="font-medium">
          {isNewQuestionDragActive ? 'Drop new question here!' : 'Drop new questions here or'}
        </span>
        {!isNewQuestionDragActive && (
          <button
            className="px-5 py-2.5 bg-indigo-500 text-white border-none rounded-md font-medium cursor-pointer hover:bg-indigo-600 transition-all duration-150"
            onClick={handleAddQuestionClick}
          >
            + Add Question
          </button>
        )}
      </div>
    </div>
  );
};

export default QuestionEditor;