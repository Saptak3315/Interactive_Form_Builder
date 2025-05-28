// src/components/FormBuilder/Core/QuestionCard.tsx
'use client';

import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { type MutableRefObject, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import invariant from 'tiny-invariant';
import Swal from 'sweetalert2';

import {
  type Edge,
  attachClosestEdge,
  extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import type { Question } from '../../../types/form.types';

// Types for question drag and drop
const questionCardKey = Symbol('question-card');
export type QuestionCardData = {
  [questionCardKey]: true;
  question: Question;
  rect: DOMRect;
};

const questionDropTargetKey = Symbol('question-drop-target');
export type QuestionDropTargetData = {
  [questionDropTargetKey]: true;
  question: Question;
};

// Type for new question types being dragged from sidebar
const newQuestionTypeKey = Symbol('new-question-type');
export type NewQuestionTypeData = {
  [newQuestionTypeKey]: true;
  questionType: string;
  label: string;
  rect: DOMRect;
};

// Helper functions
export function getQuestionCardData({
  question,
  rect,
}: Omit<QuestionCardData, typeof questionCardKey>): QuestionCardData {
  return {
    [questionCardKey]: true,
    rect,
    question,
  };
}

export function isQuestionCardData(value: Record<string | symbol, unknown>): value is QuestionCardData {
  return Boolean(value[questionCardKey]);
}

export function getQuestionDropTargetData({
  question,
}: Omit<QuestionDropTargetData, typeof questionDropTargetKey>): QuestionDropTargetData {
  return {
    [questionDropTargetKey]: true,
    question,
  };
}

export function isQuestionDropTargetData(
  value: Record<string | symbol, unknown>,
): value is QuestionDropTargetData {
  return Boolean(value[questionDropTargetKey]);
}

export function getNewQuestionTypeData({
  questionType,
  label,
  rect,
}: Omit<NewQuestionTypeData, typeof newQuestionTypeKey>): NewQuestionTypeData {
  return {
    [newQuestionTypeKey]: true,
    questionType,
    label,
    rect,
  };
}

export function isNewQuestionTypeData(value: Record<string | symbol, unknown>): value is NewQuestionTypeData {
  return Boolean(value[newQuestionTypeKey]);
}

export function isDraggingAQuestion({
  source,
}: {
  source: { data: Record<string | symbol, unknown> };
}): boolean {
  return isQuestionCardData(source.data) || isNewQuestionTypeData(source.data);
}

type QuestionCardState =
  | { type: 'idle' }
  | { type: 'is-dragging' }
  | { type: 'is-dragging-and-left-self' }
  | { type: 'is-over'; dragging: DOMRect; closestEdge: Edge }
  | { type: 'preview'; container: HTMLElement; dragging: DOMRect };

const idle: QuestionCardState = { type: 'idle' };

// Utility function to check if running in Safari
function isSafari(): boolean {
  return typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

// Utility for shallow equality check
function isShallowEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  
  return true;
}

const innerStyles: { [Key in QuestionCardState['type']]?: string } = {
  idle: 'hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md cursor-grab',
  'is-dragging': 'opacity-40 ring-2 ring-indigo-300 cursor-grabbing',
};

const outerStyles: { [Key in QuestionCardState['type']]?: string } = {
  'is-dragging-and-left-self': 'hidden',
};

interface QuestionDisplayProps {
  question: Question;
  index: number;
  state: QuestionCardState;
  isActive: boolean;
  onSelect: (id: number) => void;
  onDelete: (id: number, title: string) => void;
  outerRef?: MutableRefObject<HTMLDivElement | null>;
  innerRef?: MutableRefObject<HTMLDivElement | null>;
}

export function QuestionDisplay({
  question,
  index,
  state,
  isActive,
  onSelect,
  onDelete,
  outerRef,
  innerRef,
}: QuestionDisplayProps) {
  // Helper function to get file type from media type
  const getFileType = (mediaType?: string): 'image' | 'video' | 'audio' | 'unknown' => {
    if (!mediaType) return 'unknown';
    if (mediaType.startsWith('image/')) return 'image';
    if (mediaType.startsWith('video/')) return 'video';
    if (mediaType.startsWith('audio/')) return 'audio';
    return 'unknown';
  };

  // Component to render media preview in question list
  const renderMediaPreview = () => {
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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't select if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onSelect(question.id);
  };

  return (
    <div
      ref={outerRef}
      className={`flex flex-shrink-0 flex-col ${outerStyles[state.type] || ''}`}
    >
      {/* Stable blue shadow above if dropping at top */}
      {state.type === 'is-over' && state.closestEdge === 'top' ? (
        <div className="flex-shrink-0 rounded-lg bg-blue-100 border border-blue-300 mx-0 my-2" 
             style={{ height: Math.max(state.dragging.height, 60) }}>
        </div>
      ) : null}
      
      <div
        className={`
          group mb-3 p-4 bg-white border-2 rounded-lg select-none relative block w-full
          ${isActive ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100' : 'border-gray-200'}
          ${innerStyles[state.type] || ''}
        `}
        ref={innerRef}
        onClick={handleCardClick}
        style={
          state.type === 'preview'
            ? {
                width: state.dragging.width,
                height: state.dragging.height,
                transform: !isSafari() ? 'rotate(2deg)' : undefined,
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
              }
            : undefined
        }
      >
        <div className="pointer-events-none">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              {/* No drag handler icon - entire card is draggable */}
              <span className="font-semibold text-indigo-500 text-base">{index + 1}.</span>
              <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-500 uppercase font-medium tracking-wide">
                {question.type}
              </span>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 pointer-events-auto">
              <button
                className="w-8 h-8 border-none rounded-md cursor-pointer flex items-center justify-center text-sm bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 hover:scale-110"
                onClick={(e) => {
                  e.stopPropagation();
                  Swal.fire('Duplicate functionality coming soon!');
                }}
                title="Duplicate question"
              >
                📋
              </button>
              <button
                className="w-8 h-8 border-none rounded-md cursor-pointer flex items-center justify-center text-sm bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 hover:scale-110"
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

            {question.type === 'textarea' && (
              <div className="mt-2.5 w-full block bg-gray-50 bg-opacity-50 p-1.5 rounded-md">
                <textarea
                  className="w-full h-9 px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-500 text-sm block shadow-sm resize-none"
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
            {renderMediaPreview()}

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
      </div>
      
      {/* Stable blue shadow below if dropping at bottom */}
      {state.type === 'is-over' && state.closestEdge === 'bottom' ? (
        <div className="flex-shrink-0 rounded-lg bg-blue-100 border border-blue-300 mx-0 my-2" 
             style={{ height: Math.max(state.dragging.height, 60) }}>
        </div>
      ) : null}
    </div>
  );
}

interface QuestionCardProps {
  question: Question;
  index: number;
  isActive: boolean;
  onSelect: (id: number) => void;
  onDelete: (id: number, title: string) => void;
}

export function QuestionCard({ question, index, isActive, onSelect, onDelete }: QuestionCardProps) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<QuestionCardState>(idle);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    
    invariant(outer && inner);

    return combine(
      draggable({
        element: inner, // Entire card is draggable
        getInitialData: ({ element }) =>
          getQuestionCardData({ question, rect: element.getBoundingClientRect() }),
        onGenerateDragPreview({ nativeSetDragImage, location, source }) {
          const data = source.data;
          invariant(isQuestionCardData(data));
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: preserveOffsetOnSource({ element: inner, input: location.current.input }),
            render({ container }) {
              setState({
                type: 'preview',
                container,
                dragging: inner.getBoundingClientRect(),
              });
            },
          });
        },
        onDragStart() {
          setState({ type: 'is-dragging' });
        },
        onDrop() {
          setState(idle);
        },
      }),
      dropTargetForElements({
        element: outer,
        getIsSticky: () => true,
        canDrop: isDraggingAQuestion,
        getData: ({ element, input }) => {
          const data = getQuestionDropTargetData({ question });
          return attachClosestEdge(data, { element, input, allowedEdges: ['top', 'bottom'] });
        },
        onDragEnter({ source, self }) {
          // Handle question reordering
          if (isQuestionCardData(source.data)) {
            if (source.data.question.id === question.id) return;
            
            const closestEdge = extractClosestEdge(self.data);
            if (!closestEdge) return;

            setState({ type: 'is-over', dragging: source.data.rect, closestEdge });
          }
          // Handle new question type drop
          else if (isNewQuestionTypeData(source.data)) {
            const closestEdge = extractClosestEdge(self.data);
            if (!closestEdge) return;

            setState({ type: 'is-over', dragging: source.data.rect, closestEdge });
          }
        },
        onDrag({ source, self }) {
          // Handle question reordering
          if (isQuestionCardData(source.data)) {
            if (source.data.question.id === question.id) return;
            
            const closestEdge = extractClosestEdge(self.data);
            if (!closestEdge) return;
            
            const proposed: QuestionCardState = { type: 'is-over', dragging: source.data.rect, closestEdge };
            setState((current) => {
              if (isShallowEqual(proposed, current)) return current;
              return proposed;
            });
          }
          // Handle new question type drop
          else if (isNewQuestionTypeData(source.data)) {
            const closestEdge = extractClosestEdge(self.data);
            if (!closestEdge) return;
            
            const proposed: QuestionCardState = { type: 'is-over', dragging: source.data.rect, closestEdge };
            setState((current) => {
              if (isShallowEqual(proposed, current)) return current;
              return proposed;
            });
          }
        },
        onDragLeave({ source }) {
          if (isQuestionCardData(source.data)) {
            if (source.data.question.id === question.id) {
              setState({ type: 'is-dragging-and-left-self' });
              return;
            }
          }
          setState(idle);
        },
        onDrop() {
          setState(idle);
        },
      }),
    );
  }, [question, index, isActive, onSelect, onDelete]);

  return (
    <>
      <QuestionDisplay 
        outerRef={outerRef} 
        innerRef={innerRef} 
        state={state} 
        question={question} 
        index={index}
        isActive={isActive}
        onSelect={onSelect}
        onDelete={onDelete}
      />
      {state.type === 'preview'
        ? createPortal(
            <QuestionDisplay 
              state={state} 
              question={question} 
              index={index}
              isActive={isActive}
              onSelect={onSelect}
              onDelete={onDelete}
            />, 
            state.container
          )
        : null}
    </>
  );
}