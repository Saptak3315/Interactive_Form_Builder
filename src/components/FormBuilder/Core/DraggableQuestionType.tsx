// src/components/FormBuilder/Core/DraggableQuestionType.tsx

import React, { useEffect, useRef, useState } from "react";
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
      className="flex items-center justify-between p-3 bg-white border-2 border-indigo-500 rounded-md shadow-lg"
      style={{
        width: rect.width,
        height: rect.height,
        transform: !isSafari() ? 'rotate(3deg) scale(1.05)' : 'scale(1.05)',
      }}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center justify-center w-8 h-8 text-xl bg-indigo-100 rounded-md">
          {questionType.icon}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-indigo-800">
            {questionType.label}
          </span>
          <span className="text-xs text-indigo-600 leading-tight">
            {questionType.description}
          </span>
        </div>
      </div>
      <div className="text-indigo-600 font-bold text-base">
        ⋯
      </div>
    </div>
  );
}

const DraggableQuestionType: React.FC<DraggableQuestionTypeProps> = ({
  questionType,
}) => {
  const { state, dispatch } = useFormContext();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<DragState>({ type: 'idle' });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    return draggable({
      element,
      getInitialData: ({ element }) => {
        return getNewQuestionTypeData({
          questionType: questionType.type,
          label: questionType.label,
          rect: element.getBoundingClientRect(),
        });
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
        console.log(`Starting drag for ${questionType.type} question`);
        setDragState({ type: 'is-dragging' });
      },
      onDrop() {
        console.log(`Ended drag for ${questionType.type} question`);
        setDragState({ type: 'idle' });
      },
    });
  }, [questionType]);

  const handleClick = () => {
    // Fallback for non-drag interaction
    const orderPosition = state.questions.length;
    const newQuestion = createDefaultQuestion(
      questionType.type as any,
      orderPosition
    );
    dispatch(addQuestion(newQuestion));
  };

  const isDragging = dragState.type === 'is-dragging';

  return (
    <>
      <div
        ref={elementRef}
        className={`
          flex items-center justify-between p-3 bg-white border border-slate-200 rounded-md transition-all duration-200 select-none
          hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md group cursor-grab
          ${isDragging ? 'opacity-50 scale-95' : ''}
        `}
      >
        <div 
          onClick={handleClick}
          className="flex items-center gap-3 flex-1 cursor-pointer"
          title={`${questionType.description} (Click or drag to add)`}
        >
          <div className="flex items-center justify-center w-8 h-8 text-xl bg-slate-100 rounded-md group-hover:bg-indigo-100 transition-colors duration-200">
            {questionType.icon}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-slate-800 group-hover:text-indigo-800 transition-colors duration-200">
              {questionType.label}
            </span>
            <span className="text-xs text-slate-500 leading-tight group-hover:text-indigo-600 transition-colors duration-200">
              {questionType.description}
            </span>
          </div>
        </div>
        <div className={`
          text-slate-400 font-bold text-base transition-all duration-200
          ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}>
          ⋯
        </div>
      </div>

      {/* Drag Preview Portal */}
      {dragState.type === 'preview' && (
        createPortal(
          <QuestionTypePreview 
            questionType={questionType} 
            rect={dragState.rect}
          />,
          dragState.container
        )
      )}
    </>
  );
};

export default DraggableQuestionType;