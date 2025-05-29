// src/components/FormBuilder/Core/QuestionEditor.tsx

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  const monitorsInitialized = useRef<boolean>(false);
  
  // Track drag state for better UX
  const [isNewQuestionDragActive, setIsNewQuestionDragActive] = useState(false);
  const [recentlyAddedQuestionId, setRecentlyAddedQuestionId] = useState<number | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{
    questionId: number;
    edge: 'top' | 'bottom';
  } | null>(null);
  
  // Create a stable key that changes when form structure changes significantly
  const formStateKey = useMemo(() => {
    return `${state.formId || 'new'}-${state.questions.length}-${Date.now()}`;
  }, [state.formId, state.questions.length]);

  // Enhanced add question function with better position handling
  const addQuestionAtPosition = useCallback((questionType: string, insertIndex?: number) => {
    console.log('Adding question:', { questionType, insertIndex, currentLength: state.questions.length });
    
    // Get fresh state reference to avoid stale closures
    const currentQuestions = state.questions;
    const orderPosition = insertIndex !== undefined ? insertIndex : currentQuestions.length;
    const newQuestion = createDefaultQuestion(questionType as any, orderPosition);
    const newQuestionId = Math.floor(Math.random() * 100000);
    const questionWithId = { ...newQuestion, id: newQuestionId };
    
    if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= currentQuestions.length) {
      // Insert at specific position
      const newQuestions = [...currentQuestions];
      newQuestions.splice(insertIndex, 0, questionWithId);
      
      // Update order positions for all questions
      const reorderedQuestions = newQuestions.map((question, index) => ({
        ...question,
        orderPosition: index
      }));
      
      dispatch(reorderQuestions(reorderedQuestions));
      dispatch(setActiveQuestion(newQuestionId));
      
      console.log('Question inserted at position:', insertIndex, 'New array length:', reorderedQuestions.length);
    } else {
      // Add at end
      dispatch(addQuestion(questionWithId));
      console.log('Question added at end, new length:', currentQuestions.length + 1);
    }
    
    setRecentlyAddedQuestionId(newQuestionId);
    setTimeout(() => setRecentlyAddedQuestionId(null), 1000); // Longer animation time
  }, [dispatch, state.questions]);

  // Auto-scroll setup - stable reference
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    return autoScrollForElements({
      element: scrollContainer,
      canScroll: ({ source }) => isDraggingAQuestion({ source }),
      getAllowedAxis: () => 'vertical',
    });
  }, [formStateKey]);

  // Enhanced drag monitor with better debugging and error handling
  useEffect(() => {
    console.log('Setting up enhanced drag monitors for form:', state.formId, 'questions:', state.questions.length);
    
    const cleanup = monitorForElements({
      canMonitor: isDraggingAQuestion,
      onDragStart({ source }) {
        console.log('Drag started:', source.data);
        if (isNewQuestionTypeData(source.data)) {
          setIsNewQuestionDragActive(true);
        }
        setDragOverTarget(null);
      },
      onDrop({ source, location }) {
        console.log('Drop event:', { source: source.data, location });
        
        // Reset UI state first
        if (isNewQuestionTypeData(source.data)) {
          setIsNewQuestionDragActive(false);
        }
        setDragOverTarget(null);

        const dragging = source.data;

        try {
          // Handle new question drops with positional insertion
          if (isNewQuestionTypeData(dragging)) {
            console.log('Processing new question drop:', dragging.questionType);
            
            // Check if dropped on main drop zone (at end)
            const isDropZoneDrop = location.current.dropTargets.some(target => 
              target.element === dropZoneRef.current
            );
            
            if (isDropZoneDrop) {
              console.log('Dropping in main drop zone - adding at end');
              setTimeout(() => addQuestionAtPosition(dragging.questionType), 0);
              return;
            }
            
            // Handle insertion between questions
            const targetDropData = location.current.dropTargets.find(target => 
              isQuestionDropTargetData(target.data)
            );
            
            if (targetDropData && isQuestionDropTargetData(targetDropData.data)) {
              console.log('Dropping between questions');
              const targetQuestion = targetDropData.data.question;
              const currentQuestions = state.questions;
              const targetIndex = currentQuestions.findIndex(q => q.id === targetQuestion.id);
              
              if (targetIndex === -1) {
                console.error('Target question not found in current questions array');
                return;
              }
              
              const closestEdge = extractClosestEdge(targetDropData.data);
              let insertIndex = targetIndex;
              
              if (closestEdge === 'bottom') {
                insertIndex = targetIndex + 1;
              }
              
              console.log('Calculated insert position:', {
                targetIndex,
                closestEdge,
                insertIndex,
                totalQuestions: currentQuestions.length
              });
              
              // Validate insert index
              if (insertIndex >= 0 && insertIndex <= currentQuestions.length) {
                setTimeout(() => addQuestionAtPosition(dragging.questionType, insertIndex), 0);
              } else {
                console.error('Invalid insert index calculated:', insertIndex);
                // Fallback to adding at end
                setTimeout(() => addQuestionAtPosition(dragging.questionType), 0);
              }
            }
            return;
          }

          // Handle question reordering with validation
          if (isQuestionCardData(dragging)) {
            console.log('Processing question reorder');
            const innerMost = location.current.dropTargets[0];
            if (!innerMost) {
              console.log('No drop target found for reorder');
              return;
            }

            const dropTargetData = innerMost.data;
            if (!isQuestionDropTargetData(dropTargetData)) {
              console.log('Invalid drop target data for reorder');
              return;
            }

            const currentQuestions = state.questions;
            const startIndex = currentQuestions.findIndex(q => q.id === dragging.question.id);
            const finishIndex = currentQuestions.findIndex(q => q.id === dropTargetData.question.id);

            if (startIndex === -1 || finishIndex === -1) {
              console.error('Invalid question indices for reorder:', { startIndex, finishIndex });
              return;
            }
            
            if (startIndex === finishIndex) {
              console.log('Same position, no reorder needed');
              return;
            }

            const closestEdge = extractClosestEdge(dropTargetData);
            const reordered = reorderWithEdge({
              axis: 'vertical',
              list: currentQuestions,
              startIndex,
              indexOfTarget: finishIndex,
              closestEdgeOfTarget: closestEdge,
            });

            const reorderedWithPositions = reordered.map((question, index) => ({
              ...question,
              orderPosition: index
            }));

            console.log('Reordering questions:', {
              from: startIndex,
              to: finishIndex,
              edge: closestEdge,
              newLength: reorderedWithPositions.length
            });

            dispatch(reorderQuestions(reorderedWithPositions));
          }
        } catch (error) {
          console.error('Error handling drop:', error);
          Swal.fire('Error', 'Failed to process drop operation. Please try again.', 'error');
        }
      },
    });

    monitorsInitialized.current = true;
    return cleanup;
  }, [formStateKey, addQuestionAtPosition, state.questions]);

  // Enhanced drop zone setup
  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    console.log('Setting up enhanced drop zone for form:', state.formId);
    
    return dropTargetForElements({
      element: dropZone,
      canDrop: ({ source }) => {
        const canDrop = isNewQuestionTypeData(source.data);
        console.log('Drop zone canDrop check:', canDrop, source.data);
        return canDrop;
      },
      getData: () => ({ dropZone: true }),
      onDragEnter: ({ source }) => {
        if (isNewQuestionTypeData(source.data)) {
          console.log('Entered main drop zone');
          setIsNewQuestionDragActive(true);
        }
      },
      onDragLeave: ({ source }) => {
        if (isNewQuestionTypeData(source.data)) {
          console.log('Left main drop zone');
          setIsNewQuestionDragActive(false);
        }
      },
    });
  }, [formStateKey]);

  const handleQuestionSelect = useCallback((questionId: number) => {
    dispatch(setActiveQuestion(questionId));
  }, [dispatch]);

  const handleQuestionDelete = useCallback((questionId: number, questionTitle: string) => {
    Swal.fire({
      title: 'Delete Question?',
      text: `Are you sure you want to delete "${questionTitle || 'this question'}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteQuestion(questionId));
        Swal.fire('Deleted!', 'Question has been deleted.', 'success');
      }
    });
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
        addQuestionAtPosition(result.value);
      }
    });
  };

  // Debug logging
  useEffect(() => {
    console.log('QuestionEditor state changed:', {
      formId: state.formId,
      questionsCount: state.questions.length,
      activeQuestionId: state.activeQuestionId,
      monitorsInitialized: monitorsInitialized.current,
      isNewQuestionDragActive,
      dragOverTarget
    });
  }, [state.formId, state.questions.length, state.activeQuestionId, isNewQuestionDragActive, dragOverTarget]);

  if (state.questions.length === 0) {
    return (
      <div 
        key={`empty-${formStateKey}`}
        ref={dropZoneRef}
        className={`
          flex items-center justify-center h-full border-2 border-dashed rounded-xl transition-all duration-300
          ${isNewQuestionDragActive
            ? 'bg-blue-50 border-blue-400 shadow-inner shadow-blue-100' 
            : 'bg-gray-50 hover:bg-blue-50 hover:border-blue-300 border-gray-300'
          }
        `}
        style={{ minHeight: "400px" }}
      >
        <div className="text-center text-slate-600 p-10">
          <div className={`text-5xl mb-4 transition-all duration-300 ${
            isNewQuestionDragActive ? 'animate-bounce' : 'opacity-40'
          }`}>
            {isNewQuestionDragActive ? '🎯' : '📝'}
          </div>
          <h3 className="text-slate-800 text-xl font-semibold mb-2">
            {isNewQuestionDragActive ? 'Drop here to add your first question!' : 'Start building your form'}
          </h3>
          <p className="text-base mb-5">
            {isNewQuestionDragActive
              ? 'Release to add question to your form' 
              : 'Drag question types from the sidebar or click them to add'
            }
          </p>
          <div className={`
            px-6 py-3 border border-dashed rounded-md font-medium transition-all duration-300
            ${isNewQuestionDragActive
              ? 'bg-blue-100 border-blue-400 text-blue-800 shadow-lg'
              : 'bg-blue-50 border-blue-300 text-blue-800'
            }
          `}>
            <span>
              {isNewQuestionDragActive ? '🎯 Drop question here!' : '📋 Drop question types here'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div key={`editor-${formStateKey}`} className="h-full flex flex-col gap-5">
      <div 
        ref={scrollContainerRef}
        className="flex-1 flex flex-col gap-3 overflow-y-auto"
      >
        {state.questions.map((question, index) => (
          <div 
            key={`${question.id}-${formStateKey}`}
            className={`transition-all duration-500 ${
              recentlyAddedQuestionId === question.id 
                ? 'animate-pulse scale-105 shadow-lg shadow-indigo-200' 
                : ''
            }`}
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

      {/* Enhanced drop zone at bottom */}
      <div
        ref={dropZoneRef}
        className={`
          p-6 border-2 border-dashed rounded-lg text-center flex flex-col items-center gap-3 transition-all duration-300
          ${isNewQuestionDragActive
            ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-lg shadow-blue-100' 
            : 'border-gray-300 bg-gray-50 text-gray-400 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600'
          }
        `}
        style={{ minHeight: "100px" }}
      >
        <div className={`text-2xl transition-all duration-300 ${
          isNewQuestionDragActive ? 'animate-bounce' : ''
        }`}>
          {isNewQuestionDragActive ? '🎯' : '➕'}
        </div>
        <span className="font-medium text-lg">
          {isNewQuestionDragActive 
            ? 'Drop new question here to add at the end!' 
            : 'Drop new questions here or'
          }
        </span>
        {!isNewQuestionDragActive && (
          <button
            className="px-5 py-2.5 bg-indigo-500 text-white border-none rounded-md font-medium cursor-pointer hover:bg-indigo-600 transition-all duration-150 shadow-md hover:shadow-lg"
            onClick={handleAddQuestionClick}
          >
            ➕ Add Question
          </button>
        )}
        {isNewQuestionDragActive && (
          <div className="text-sm text-blue-600 font-medium">
            This will add question #{state.questions.length + 1}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionEditor;