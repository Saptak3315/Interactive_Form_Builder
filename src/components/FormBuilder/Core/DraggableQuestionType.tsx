// src/components/FormBuilder/Core/DraggableQuestionType.tsx

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useFormContext } from "../../../context/FormContext/FormProvider";
import {
  addQuestion,
  createDefaultQuestion,
} from "../../../context/FormContext/formActions";
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { getNewQuestionTypeData } from './QuestionCard';
import { createPortal } from 'react-dom';
import invariant from 'tiny-invariant';

interface QuestionTypeOption {
  type: string;
  label: string;
  icon: string;
  description: string;
  category: string;
}

interface DraggableQuestionTypeProps {
  questionType: QuestionTypeOption;
}

type DragState = 
  | { type: 'idle' }
  | { type: 'is-dragging' }
  | { type: 'preview'; container: HTMLElement; rect: DOMRect };

// Utility function to check if running in Safari
function isSafari(): boolean {
  return typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

function QuestionTypePreview({ 
  questionType, 
  rect 
}: { 
  questionType: QuestionTypeOption;
  rect: DOMRect;
}) {
  return (
    <div
      className="flex items-center justify-between p-3 bg-white border-2 border-blue-500 rounded-md shadow-xl"
      style={{
        width: rect.width,
        height: rect.height,
        transform: !isSafari() ? 'rotate(2deg) scale(1.05)' : 'scale(1.05)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center justify-center w-8 h-8 text-xl bg-blue-100 rounded-md">
          {questionType.icon}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-blue-800">
            {questionType.label}
          </span>
          <span className="text-xs text-blue-600 leading-tight">
            {questionType.description}
          </span>
        </div>
      </div>
      <div className="text-blue-600 font-bold text-base animate-pulse">
        ➕
      </div>
    </div>
  );
}

const DraggableQuestionType: React.FC<DraggableQuestionTypeProps> = ({
  questionType,
}) => {
  const { state, dispatch, formVersion, isFormLoading } = useFormContext();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<DragState>({ type: 'idle' });
  const [isDragInProgress, setIsDragInProgress] = useState(false);
  const [justClicked, setJustClicked] = useState(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const draggableCleanupRef = useRef<(() => void) | null>(null);

  // Stable add question function
  const addQuestionStable = useCallback((questionType: string) => {
    if (isFormLoading) {
      console.log('Form is loading, skipping question addition');
      return;
    }
    
    console.log('Adding question via click:', questionType);
    const orderPosition = state.questions.length;
    const newQuestion = createDefaultQuestion(questionType as any, orderPosition);
    dispatch(addQuestion(newQuestion));
  }, [dispatch, isFormLoading, state.questions.length]);

  // Enhanced draggable setup with better data structure
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Clean up previous draggable if exists
    if (draggableCleanupRef.current) {
      draggableCleanupRef.current();
    }

    console.log(`Setting up enhanced draggable for ${questionType.type} (form version: ${formVersion})`);

    const cleanup = draggable({
      element,
      getInitialData: ({ element }) => {
        const data = getNewQuestionTypeData({
          questionType: questionType.type,
          label: questionType.label,
          rect: element.getBoundingClientRect(),
        });
        console.log('Enhanced draggable data created:', {
          questionType: questionType.type,
          label: questionType.label,
          category: questionType.category,
          description: questionType.description
        });
        return data;
      },
      onGenerateDragPreview({ nativeSetDragImage, location, source }) {
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: preserveOffsetOnSource({ element, input: location.current.input }),
          render({ container }) {
            setDragState({
              type: 'preview',
              container,
              rect: element.getBoundingClientRect(),
            });
          },
        });
      },
      onDragStart() {
        console.log(`Starting enhanced drag for ${questionType.type} question`);
        setIsDragInProgress(true);
        setDragState({ type: 'is-dragging' });
        
        // Clear any existing timeouts
        if (dragTimeoutRef.current) {
          clearTimeout(dragTimeoutRef.current);
        }
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
        }
      },
      onDrop() {
        console.log(`Completed enhanced drag for ${questionType.type} question`);
        setDragState({ type: 'idle' });
        
        // Reset drag flag after a delay to ensure drop is processed
        dragTimeoutRef.current = setTimeout(() => {
          setIsDragInProgress(false);
        }, 300); // Slightly longer delay for better UX
      },
    });

    draggableCleanupRef.current = cleanup;
    return cleanup;
  }, [questionType, formVersion]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      if (draggableCleanupRef.current) {
        draggableCleanupRef.current();
      }
    };
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Prevent click if form is loading
    if (isFormLoading) {
      console.log('Click prevented - form is loading');
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Prevent click if drag is in progress
    if (isDragInProgress) {
      console.log('Click prevented - drag in progress');
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Prevent rapid double clicks
    if (justClicked) {
      console.log('Click prevented - recent click');
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    console.log('Enhanced click handler: Adding question via click');
    setJustClicked(true);
    
    // Enhanced visual feedback for click
    if (elementRef.current) {
      elementRef.current.style.transform = 'scale(0.95)';
      elementRef.current.style.transition = 'transform 0.15s ease-out';
      setTimeout(() => {
        if (elementRef.current) {
          elementRef.current.style.transform = '';
          elementRef.current.style.transition = '';
        }
      }, 150);
    }
    
    // Add question with slight delay to ensure state is ready
    setTimeout(() => {
      addQuestionStable(questionType.type);
    }, 50);
    
    // Reset click flag
    clickTimeoutRef.current = setTimeout(() => {
      setJustClicked(false);
    }, 300);
  }, [isDragInProgress, justClicked, addQuestionStable, questionType.type, isFormLoading]);

  const isDragging = dragState.type === 'is-dragging';
  const isDisabled = isFormLoading;

  return (
    <>
      <div
        ref={elementRef}
        className={`
          flex items-center justify-between p-3 bg-white border border-slate-200 rounded-md transition-all duration-200 select-none
          ${isDisabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:border-blue-500 hover:bg-blue-50 hover:shadow-md group cursor-grab'
          }
          ${isDragging ? 'opacity-40 scale-95 shadow-lg border-blue-300 bg-blue-50' : ''}
          ${justClicked ? 'ring-2 ring-blue-300' : ''}
        `}
        style={{
          // Ensure smooth transitions without causing layout shifts
          transform: isDragging ? 'scale(0.95)' : '',
          transition: 'all 0.2s ease-out',
        }}
      >
        <div 
          onClick={handleClick}
          className={`flex items-center gap-3 flex-1 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          title={isDisabled 
            ? 'Please wait...' 
            : `${questionType.description} (Click to add at end, or drag to main drop zone)`
          }
        >
          <div className={`
            flex items-center justify-center w-8 h-8 text-xl bg-slate-100 rounded-md transition-all duration-200
            ${!isDisabled && 'group-hover:bg-blue-100'}
            ${isDragging ? 'bg-blue-200' : ''}
          `}>
            {questionType.icon}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className={`
              text-sm font-semibold text-slate-800 transition-colors duration-200
              ${!isDisabled && 'group-hover:text-blue-800'}
              ${isDragging ? 'text-blue-700' : ''}
            `}>
              {questionType.label}
            </span>
            <span className={`
              text-xs text-slate-500 leading-tight transition-colors duration-200
              ${!isDisabled && 'group-hover:text-blue-600'}
              ${isDragging ? 'text-blue-500' : ''}
            `}>
              {questionType.description}
            </span>
          </div>
        </div>
        <div className={`
          text-slate-400 font-bold text-base transition-all duration-300
          ${isDragging 
            ? 'opacity-100 text-blue-500 animate-pulse scale-110' 
            : !isDisabled 
              ? 'opacity-0 group-hover:opacity-100 group-hover:text-blue-500'
              : 'opacity-30'
          }
        `}>
          {isFormLoading ? '⏳' : isDragging ? '🎯' : '➕'}
        </div>
      </div>

      {/* Enhanced Drag Preview Portal */}
      {dragState.type === 'preview' && (
        createPortal(
          <QuestionTypePreview 
            questionType={questionType} 
            rect={dragState.rect}
          />,
          dragState.container
        )
      )}

      {/* Enhanced click feedback animation styles */}
      <style>{`
        @keyframes enhanced-click-pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
          }
          50% {
            transform: scale(0.95);
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
        
        .enhanced-click-animate {
          animation: enhanced-click-pulse 0.3s ease-in-out;
        }

        @keyframes drag-ready {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }
        
        .group:hover .animate-drag-ready {
          animation: drag-ready 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default DraggableQuestionType;