// src/utils/pdnd-template/Card.tsx
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
import { 
  getCardData, 
  getCardDropTargetData, 
  isCardData, 
  isDraggingACard, 
  type TCard 
} from './types';

type TCardState =
  | { type: 'idle' }
  | { type: 'is-dragging' }
  | { type: 'is-dragging-and-left-self' }
  | { type: 'is-over'; dragging: DOMRect; closestEdge: Edge }
  | { type: 'preview'; container: HTMLElement; dragging: DOMRect };

const idle: TCardState = { type: 'idle' };

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

const innerStyles: { [Key in TCardState['type']]?: string } = {
  idle: 'hover:outline outline-2 outline-blue-200 cursor-grab transition-all duration-150',
  'is-dragging': 'opacity-40',
};

const outerStyles: { [Key in TCardState['type']]?: string } = {
  'is-dragging-and-left-self': 'hidden',
};

export function CardShadow({ dragging }: { dragging: DOMRect }) {
  return (
    <div 
      className="flex-shrink-0 rounded bg-blue-100 border-2 border-dashed border-blue-300 mx-3 my-1" 
      style={{ height: dragging.height }} 
    />
  );
}

export function CardDisplay({
  card,
  state,
  outerRef,
  innerRef,
}: {
  card: TCard;
  state: TCardState;
  outerRef?: MutableRefObject<HTMLDivElement | null>;
  innerRef?: MutableRefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={outerRef}
      className={`flex flex-shrink-0 flex-col ${outerStyles[state.type] || ''}`}
    >
      {/* Shadow above if dropping at top */}
      {state.type === 'is-over' && state.closestEdge === 'top' ? (
        <CardShadow dragging={state.dragging} />
      ) : null}
      
      <div
        className={`m-3 rounded-lg bg-white border border-gray-200 p-4 text-gray-800 shadow-sm ${innerStyles[state.type] || ''}`}
        ref={innerRef}
        style={
          state.type === 'preview'
            ? {
                width: state.dragging.width,
                height: state.dragging.height,
                transform: !isSafari() ? 'rotate(4deg)' : undefined,
              }
            : undefined
        }
      >
        <div className="text-sm font-medium">{card.description}</div>
      </div>
      
      {/* Shadow below if dropping at bottom */}
      {state.type === 'is-over' && state.closestEdge === 'bottom' ? (
        <CardShadow dragging={state.dragging} />
      ) : null}
    </div>
  );
}

export function Card({ card, columnId }: { card: TCard; columnId: string }) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<TCardState>(idle);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    invariant(outer && inner);

    return combine(
      draggable({
        element: inner,
        getInitialData: ({ element }) =>
          getCardData({ card, columnId, rect: element.getBoundingClientRect() }),
        onGenerateDragPreview({ nativeSetDragImage, location, source }) {
          const data = source.data;
          invariant(isCardData(data));
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
        canDrop: isDraggingACard,
        getData: ({ element, input }) => {
          const data = getCardDropTargetData({ card, columnId });
          return attachClosestEdge(data, { element, input, allowedEdges: ['top', 'bottom'] });
        },
        onDragEnter({ source, self }) {
          if (!isCardData(source.data)) return;
          if (source.data.card.id === card.id) return;
          
          const closestEdge = extractClosestEdge(self.data);
          if (!closestEdge) return;

          setState({ type: 'is-over', dragging: source.data.rect, closestEdge });
        },
        onDrag({ source, self }) {
          if (!isCardData(source.data)) return;
          if (source.data.card.id === card.id) return;
          
          const closestEdge = extractClosestEdge(self.data);
          if (!closestEdge) return;
          
          const proposed: TCardState = { type: 'is-over', dragging: source.data.rect, closestEdge };
          setState((current) => {
            if (isShallowEqual(proposed, current)) return current;
            return proposed;
          });
        },
        onDragLeave({ source }) {
          if (!isCardData(source.data)) return;
          
          if (source.data.card.id === card.id) {
            setState({ type: 'is-dragging-and-left-self' });
            return;
          }
          setState(idle);
        },
        onDrop() {
          setState(idle);
        },
      }),
    );
  }, [card, columnId]);

  return (
    <>
      <CardDisplay outerRef={outerRef} innerRef={innerRef} state={state} card={card} />
      {state.type === 'preview'
        ? createPortal(<CardDisplay state={state} card={card} />, state.container)
        : null}
    </>
  );
}