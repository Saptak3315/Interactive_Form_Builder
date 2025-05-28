// src/components/FormBuilder/Core/QuestionEditor.tsx

import React, { useState, useEffect, useCallback } from 'react';
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
import { useRef } from 'react';

const QuestionEditor: React.FC = () => {
  const { state, dispatch } = useFormContext();
  const [forceUpdate, setForceUpdate] = useState(0);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lastDropTimeRef = useRef<number>(0);
  const processingDropRef = useRef<boolean>(false);

  // Visual feedback states
  const [isDragActive, setIsDragActive] = useState(false);
  const [dropZoneActive, setDropZoneActive] = useState(false);
  const [recentlyAddedQuestionId, setRecentlyAddedQuestionId] = useState<number | null>(null);

  // Debounced add question function to prevent duplicates
  const debouncedAddQuestion = useCallback((questionType: string, insertIndex?: number) => {
    const now = Date.now();
    const timeSinceLastDrop = now - lastDropTimeRef.current;
    
    // Prevent duplicate drops within 300ms
    if (timeSinceLastDrop < 300 && processingDropRef.current) {
      console.log('Debounced: Preventing duplicate question addition');
      return;
    }
    
    processingDropRef.current = true;
    lastDropTimeRef.current = now;
    
    const orderPosition = insertIndex !== undefined ? insertIndex : state.questions.length;
    const newQuestion = createDefaultQuestion(questionType as any, orderPosition);
    const newQuestionId = Math.floor(Math.random() * 100000);
    
    if (insertIndex !== undefined) {
      // Insert at specific position
      const newQuestions = [...state.questions];
      const questionWithId = { ...newQuestion, id: newQuestionId };
      newQuestions.splice(insertIndex, 0, questionWithId);
      
      const reorderedQuestions = newQuestions.map((question, index) => ({
        ...question,
        orderPosition: index
      }));
      
      dispatch(reorderQuestions(reorderedQuestions));
      dispatch(setActiveQuestion(newQuestionId));
      setRecentlyAddedQuestionId(newQuestionId);
    } else {
      // Add to end
      const questionWithId = { ...newQuestion, id: newQuestionId };
      dispatch(addQuestion(questionWithId));
      setRecentlyAddedQuestionId(newQuestionId);
    }
    
    // Clear recent addition highlight after animation
    setTimeout(() => {
      setRecentlyAddedQuestionId(null);
    }, 500);
    
    // Reset processing flag after a delay
    setTimeout(() => {
      processingDropRef.current = false;
    }, 300);
  }, [state.questions, dispatch]);

  // Add an effect to log questions when they change and force re-render
  useEffect(() => {
    console.log("QuestionEditor questions updated:", state.questions);
    setForceUpdate(prev => prev + 1);
  }, [state.questions]);

  // Fast and responsive auto-scroll configuration
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    return autoScrollForElements({
      element: scrollContainer,
      canScroll: ({ source }) => isDraggingAQuestion({ source }),
      getAllowedAxis: () => 'vertical',
      getConfiguration: () => ({
        // Large hit zones for easy triggering
        startHitbox: { 
          top: 0.25,    // 25% from top - very responsive
          bottom: 0.25, // 25% from bottom - very responsive
          left: 0, 
          right: 0 
        },
        // Very fast scrolling for better UX
        maxScrollSpeed: 'fast',
        // Quick acceleration
        accelerationPlateauAt: 200,
      }),
    });
  }, []);

  // Global drag state monitoring for visual feedback
  useEffect(() => {
    return monitorForElements({
      canMonitor: isDraggingAQuestion,
      onDragStart() {
        setIsDragActive(true);
      },
      onDrop() {
        setIsDragActive(false);
        setDropZoneActive(false);
      },
    });
  }, []);

  // Monitor for drag and drop operations
  useEffect(() => {
    return monitorForElements({
      canMonitor: isDraggingAQuestion,
      onDrop({ source, location }) {
        const dragging = source.data;
        
        // Handle new question type drops
        if (isNewQuestionTypeData(dragging)) {
          console.log('Monitor: Dropping new question type:', dragging.questionType);
          
          // Prevent multiple drops by checking if there's a valid drop target
          if (location.current.dropTargets.length === 0) {
            console.log('Monitor: No valid drop targets, ignoring drop');
            return;
          }
          
          // Check if dropped on an existing question
          const targetDropData = location.current.dropTargets.find(target => 
            isQuestionDropTargetData(target.data)
          );
          
          if (targetDropData && isQuestionDropTargetData(targetDropData.data)) {
            // Insert before/after an existing question
            const targetQuestion = targetDropData.data.question;
            const targetIndex = state.questions.findIndex(q => q.id === targetQuestion.id);
            const closestEdge = extractClosestEdge(targetDropData.data);
            
            let insertIndex = targetIndex;
            if (closestEdge === 'bottom') {
              insertIndex = targetIndex + 1;
            }
            
            debouncedAddQuestion(dragging.questionType, insertIndex);
            return; // Early return to prevent further processing
          }
          
          // Only process drop zone drops if no question target was found
          const isDropZoneDrop = location.current.dropTargets.some(target => 
            target.element === dropZoneRef.current
          );
          
          if (isDropZoneDrop) {
            console.log('Monitor: Dropping in drop zone');
            debouncedAddQuestion(dragging.questionType);
          }
          
          return;
        }
        
        // Handle question reordering
        if (isQuestionCardData(dragging)) {
          const innerMost = location.current.dropTargets[0];
          if (!innerMost) return;

          const dropTargetData = innerMost.data;
          if (!isQuestionDropTargetData(dropTargetData)) return;

          const startIndex = state.questions.findIndex(q => q.id === dragging.question.id);
          const finishIndex = state.questions.findIndex(q => q.id === dropTargetData.question.id);

          if (startIndex === -1 || finishIndex === -1) return;
          if (startIndex === finishIndex) return;

          const closestEdge = extractClosestEdge(dropTargetData);
          const reordered = reorderWithEdge({
            axis: 'vertical',
            list: state.questions,
            startIndex,
            indexOfTarget: finishIndex,
            closestEdgeOfTarget: closestEdge,
          });

          // Update order positions
          const reorderedWithPositions = reordered.map((question, index) => ({
            ...question,
            orderPosition: index
          }));

          dispatch(reorderQuestions(reorderedWithPositions));
        }
      },
    });
  }, [state.questions, dispatch, debouncedAddQuestion]);

  // Set up drop zone for empty area with visual feedback
  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    return dropTargetForElements({
      element: dropZone,
      canDrop: ({ source }) => isNewQuestionTypeData(source.data),
      onDragEnter: () => {
        setDropZoneActive(true);
      },
      onDragLeave: () => {
        setDropZoneActive(false);
      },
      onDrop({ source }) {
        setDropZoneActive(false);
        if (isNewQuestionTypeData(source.data)) {
          console.log('DropZone: Dropping new question type in empty area:', source.data.questionType);
          debouncedAddQuestion(source.data.questionType);
        }
      },
    });
  }, [debouncedAddQuestion]);

  // Handle adding question via button
  const handleAddQuestionClick = () => {
    // Show a simple selection menu for question types
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
      customClass: {
        popup: 'animated fadeInDown'
      },
      inputValidator: (value) => {
        if (!value) {
          return 'Please select a question type';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        debouncedAddQuestion(result.value);
      }
    });
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

  console.log("QuestionEditor rendering with state:", {
    questionsCount: state.questions.length,
    forceUpdate,
    activeQuestionId: state.activeQuestionId
  });

  if (state.questions.length === 0) {
    return (
      <div 
        ref={dropZoneRef}
        className={`
          flex items-center justify-center h-full border-2 border-dashed rounded-xl
          ${isDragActive 
            ? dropZoneActive 
              ? 'bg-blue-50 border-blue-300' 
              : 'bg-gray-50 border-gray-300'
            : 'bg-gray-50 hover:bg-blue-50 hover:border-blue-300 border-gray-300'
          }
        `}
        style={{ minHeight: "400px" }}
      >
        <div className="text-center text-slate-600 p-10">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="mb-2 text-slate-800 text-xl font-semibold">
            {isDragActive && dropZoneActive ? 'Drop here to add question!' : 'Start building your form'}
          </h3>
          <p className="mb-5 text-base">
            {isDragActive 
              ? 'Release to add question to your form' 
              : 'Drag question types from the sidebar or click them to add'
            }
          </p>
          <div className={`
            px-6 py-3 border border-dashed rounded-md font-medium
            ${isDragActive && dropZoneActive
              ? 'bg-blue-100 border-blue-300 text-blue-800'
              : 'bg-blue-50 border-blue-300 text-blue-800'
            }
          `}>
            <span>{isDragActive && dropZoneActive ? 'Drop question here' : 'Drop question types here'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-5">
      {/* Questions List with Stable Scroll Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 flex flex-col gap-3 overflow-y-auto scroll-smooth custom-scrollbar"
        style={{
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f1f5f9'
        }}
      >
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          
          @keyframes questionAppear {
            0% {
              opacity: 0;
              transform: translateY(-10px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .question-appear {
            animation: questionAppear 0.3s ease-out;
          }
          
          .question-highlight {
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
            border-color: rgb(59, 130, 246);
          }
        `}</style>
        
        {state.questions.map((question, index) => (
          <div 
            key={question.id}
            className={recentlyAddedQuestionId === question.id ? 'question-appear question-highlight' : ''}
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

      {/* Stable Drop Zone for Adding Questions at End */}
      <div
        ref={dropZoneRef}
        className={`
          p-6 border-2 border-dashed rounded-lg text-center flex flex-col items-center gap-3
          ${isDragActive 
            ? dropZoneActive 
              ? 'border-blue-300 bg-blue-50 text-blue-700' 
              : 'border-gray-300 bg-gray-50 text-gray-600'
            : 'border-gray-300 bg-gray-50 text-gray-400 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600'
          }
        `}
        style={{ minHeight: "80px" }}
      >
        <span>
          {isDragActive && dropZoneActive 
            ? 'Drop new question here!' 
            : 'Drop new questions here or'
          }
        </span>
        {(!isDragActive || !dropZoneActive) && (
          <button
            className="px-5 py-2.5 bg-indigo-500 text-white border-none rounded-md font-medium cursor-pointer hover:bg-indigo-600 transform active:scale-95"
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