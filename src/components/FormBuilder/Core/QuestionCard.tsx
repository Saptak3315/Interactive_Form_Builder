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
  'is-dragging': 'opacity-50 ring-2 ring-indigo-300 cursor-grabbing',
};

const outerStyles: { [Key in QuestionCardState['type']]?: string } = {
  'is-dragging-and-left-self': 'hidden',
};

// Enhanced shadow component for reordering only
export function QuestionCardShadow({
  dragging
}: {
  dragging: DOMRect;
}) {
  return (
    <div
      className="flex-shrink-0 rounded-lg border-2 border-dashed mx-0 my-2 transition-all duration-150 bg-blue-100 border-blue-400"
      style={{
        height: Math.max(dragging.height, 80), // Same height as original question
        minHeight: '80px'
      }}
    >
      <div className="flex items-center justify-center h-full font-medium text-sm text-blue-600">
        Drop Here
      </div>
    </div>
  );
}

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
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
        <span>📎</span>
        <span>
          {fileType === 'image' && '🖼️ Image'}
          {fileType === 'video' && '🎥 Video'}
          {fileType === 'audio' && '🎵 Audio'}
          {fileType === 'unknown' && '📎 Media'}
        </span>
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

  const getQuestionIcon = (type: string) => {
    const icons: Record<string, string> = {
      text: '📝',
      textarea: '📄',
      multiple_choice: '🔘',
      checkbox: '☑️',
      number: '🔢',
      email: '📧',
      phone: '📞',
      address: '🏠',
      full_name: '👤',
      file: '📎',
      audio: '🎵',
      calculated: '🧮'
    };
    return icons[type] || '❓';
  };

  return (
    <div
      ref={outerRef}
      className={`flex flex-shrink-0 flex-col ${outerStyles[state.type] || ''}`}
    >
      {/* Shadow above if dropping at top (reordering only) */}
      {state.type === 'is-over' && state.closestEdge === 'top' ? (
        <QuestionCardShadow dragging={state.dragging} />
      ) : null}

      <div
        className={`
    group mb-2 p-3 bg-white border rounded-lg select-none relative block w-full transition-all duration-200 shadow-sm hover:shadow-md
    ${isActive
            ? 'border-indigo-500 bg-indigo-50 shadow-md ring-1 ring-indigo-200'
            : 'border-slate-200 hover:border-indigo-300'
          }
    ${state.type === 'is-over' ? 'ring-2 ring-blue-300 border-blue-300' : ''}
    ${innerStyles[state.type] || ''}
  `}
        ref={innerRef}
        onClick={handleCardClick}
        style={
          state.type === 'preview'
            ? {
              width: state.dragging.width,
              height: state.dragging.height,
              transform: !isSafari() ? 'rotate(1deg)' : undefined,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
            }
            : undefined
        }
      >
        <div className="pointer-events-none">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center text-base font-medium
                ${isActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600'
                }
              `}>
                {index + 1}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-lg">{getQuestionIcon(question.type)}</span>
                <span className={`
                  text-xs px-2 py-1 rounded-full uppercase font-medium tracking-wide
                  ${isActive
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-100 text-slate-500'
                  }
                `}>
                  {question.type.replace('_', ' ')}
                </span>
                {question.isRequired && (
                  <span className="text-red-500 text-sm font-bold">*</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 pointer-events-auto transition-opacity duration-200">
              <button
                className="w-7 h-7 border-none rounded-md cursor-pointer flex items-center justify-center text-xs bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-blue-600 transition-all duration-150"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(question.id);
                }}
                title="Edit question"
              >
                ✏️
              </button>
              <button
                className="w-7 h-7 border-none rounded-md cursor-pointer flex items-center justify-center text-xs bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600 transition-all duration-150"
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

          {/* Question Content */}
          <div className="mb-1">
            <div className={`text-sm font-medium leading-5 mb-1 ${isActive ? 'text-indigo-800' : 'text-slate-800'
              }`}>
              {question.content || `Question ${index + 1}`}
            </div>

            {question.explanation && (
              <div className={`text-xs mt-1 italic ${isActive ? 'text-indigo-600' : 'text-slate-500'
                }`}>
                {question.explanation}
              </div>
            )}

            {/* Text type specific preview */}
            {question.type === 'text' && (
              <div className="mt-2 w-full block bg-gray-50 bg-opacity-50 p-1.5 rounded-md">
                <input
                  type="text"
                  className="w-full h-6 px-2 py-1 border border-gray-200 rounded-md bg-white text-gray-500 text-xs block shadow-sm"
                  disabled
                  placeholder={question.placeholder || "Text input field"}
                />
              </div>
            )}

            {question.type === 'textarea' && (
              <div className="mt-2 w-full block bg-gray-50 bg-opacity-50 p-1.5 rounded-md">
                <textarea
                  className="w-full h-6 px-2 py-1 border border-gray-200 rounded-md bg-white text-gray-500 text-xs block shadow-sm resize-none"
                  disabled
                  placeholder={question.placeholder || "Text input field"}
                />
              </div>
            )}

            {/* Render media preview */}
            {renderMediaPreview()}

            {/* Options preview - more compact */}
            {question.options && question.options.length > 0 && (
              <div className="mt-2 p-2 bg-slate-50 rounded-md border border-slate-100">
                <div className="text-xs text-slate-500 font-medium mb-1">
                  {question.options.length} options:
                </div>
                {question.options.slice(0, 2).map((option, optIndex) => (
                  <div key={option.id} className="text-xs text-slate-600 truncate">
                    • {option.content || `Option ${optIndex + 1}`}
                  </div>
                ))}
                {question.options.length > 2 && (
                  <div className="text-xs text-slate-400 italic">
                    +{question.options.length - 2} more options
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-100 pt-2">
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

        {/* Active indicator */}
        {isActive && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white"></div>
        )}
      </div>

      {/* Shadow below if dropping at bottom (reordering only) */}
      {state.type === 'is-over' && state.closestEdge === 'bottom' ? (
        <QuestionCardShadow dragging={state.dragging} />
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
  registerRef?: (questionId: number, element: HTMLDivElement | null) => void;
}

export function QuestionCard({
  question,
  index,
  isActive,
  onSelect,
  onDelete,
  registerRef
}: QuestionCardProps) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<QuestionCardState>(idle);

  // Register ref for auto-scrolling
  useEffect(() => {
    if (registerRef && outerRef.current) {
      registerRef(question.id, outerRef.current);
    }

    return () => {
      if (registerRef) {
        registerRef(question.id, null);
      }
    };
  }, [question.id, registerRef]);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;

    invariant(outer && inner);

    return combine(
      draggable({
        element: inner,
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
        canDrop: ({ source }) => {
          // Accept both question reordering and new question insertion
          return isQuestionCardData(source.data) || isNewQuestionTypeData(source.data);
        },
        getData: ({ element, input }) => {
          const data = getQuestionDropTargetData({ question });
          return attachClosestEdge(data, { element, input, allowedEdges: ['top', 'bottom'] });
        },
        onDragEnter({ source, self }) {
          const closestEdge = extractClosestEdge(self.data);
          if (!closestEdge) return;

          // Handle existing question reordering
          if (isQuestionCardData(source.data)) {
            if (source.data.question.id === question.id) return;
            setState({
              type: 'is-over',
              dragging: source.data.rect,
              closestEdge
            });
          }

          // Handle new question insertion with same visual feedback
          else if (isNewQuestionTypeData(source.data)) {
            setState({
              type: 'is-over',
              dragging: source.data.rect,
              closestEdge
            });
          }
        },
        onDrag({ source, self }) {
          const closestEdge = extractClosestEdge(self.data);
          if (!closestEdge) return;

          let proposed: QuestionCardState;

          if (isQuestionCardData(source.data)) {
            if (source.data.question.id === question.id) return;
            proposed = {
              type: 'is-over',
              dragging: source.data.rect,
              closestEdge
            };
          } else if (isNewQuestionTypeData(source.data)) {
            proposed = {
              type: 'is-over',
              dragging: source.data.rect,
              closestEdge
            };
          } else {
            return;
          }

          setState((current) => {
            if (isShallowEqual(proposed, current)) return current;
            return proposed;
          });
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