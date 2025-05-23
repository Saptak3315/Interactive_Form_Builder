// src/utils/pdnd-core.ts
import { useRef, useEffect, useState, useCallback } from 'react';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

// ============ TYPES ============
export interface PdndData {
  id: string;
  type: string;
  [key: string]: any;
}

export type PdndHoverState = 'idle' | 'validDrop' | 'invalidDrop';

export interface PdndDragState {
  isDragging: boolean;
  canDrag: boolean;
}

export interface PdndDropState {
  hoverState: PdndHoverState;
  canDrop: boolean;
}

export interface PdndDragOptions {
  onDragStart?: (data: PdndData) => void;
  onDragEnd?: (data: PdndData) => void;
  disabled?: boolean;
}

export interface PdndDropOptions {
  canDrop?: (data: PdndData) => boolean;
  onDragEnter?: (data: PdndData) => void;
  onDragLeave?: () => void;
}

// ============ HOOKS ============
export function usePdndDraggable<T extends PdndData>(
  data: T,
  options: PdndDragOptions = {}
) {
  const ref = useRef<HTMLElement>(null);
  const [dragState, setDragState] = useState<PdndDragState>({
    isDragging: false,
    canDrag: !options.disabled,
  });

  const { onDragStart, onDragEnd, disabled = false } = options;

  const handleDragStart = useCallback(() => {
    setDragState(prev => ({ ...prev, isDragging: true }));
    onDragStart?.(data);
  }, [data, onDragStart]);

  const handleDragEnd = useCallback(() => {
    setDragState(prev => ({ ...prev, isDragging: false }));
    onDragEnd?.(data);
  }, [data, onDragEnd]);

  useEffect(() => {
    setDragState(prev => ({ ...prev, canDrag: !disabled }));
  }, [disabled]);

  useEffect(() => {
    const element = ref.current;
    if (!element || disabled) return;

    return draggable({
      element,
      getInitialData: () => data,
      onDragStart: handleDragStart,
      onDrop: handleDragEnd,
    });
  }, [data, handleDragStart, handleDragEnd, disabled]);

  return {
    ref: ref as React.RefObject<HTMLDivElement>,
    ...dragState,
  };
}

export function usePdndDropTarget(
  acceptedTypes: string[],
  onDrop: (data: PdndData) => void,
  options: PdndDropOptions = {}
) {
  const ref = useRef<HTMLElement>(null);
  const [dropState, setDropState] = useState<PdndDropState>({
    hoverState: 'idle',
    canDrop: true,
  });

  const { canDrop, onDragEnter, onDragLeave } = options;

  const validateDrop = useCallback((data: PdndData): boolean => {
    const isAcceptedType = acceptedTypes.includes(data.type);
    const customCanDrop = canDrop ? canDrop(data) : true;
    return isAcceptedType && customCanDrop;
  }, [acceptedTypes, canDrop]);

  const handleDragEnter = useCallback((data: PdndData) => {
    const isValid = validateDrop(data);
    setDropState(prev => ({
      ...prev,
      hoverState: isValid ? 'validDrop' : 'invalidDrop',
    }));
    onDragEnter?.(data);
  }, [validateDrop, onDragEnter]);

  const handleDragLeave = useCallback(() => {
    setDropState(prev => ({ ...prev, hoverState: 'idle' }));
    onDragLeave?.();
  }, [onDragLeave]);

  const handleDrop = useCallback((data: PdndData) => {
    setDropState(prev => ({ ...prev, hoverState: 'idle' }));
    if (validateDrop(data)) {
      onDrop(data);
    }
  }, [validateDrop, onDrop]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      canDrop: ({ source }) => validateDrop(source.data as PdndData),
      onDragEnter: ({ source }) => handleDragEnter(source.data as PdndData),
      onDragLeave: handleDragLeave,
      onDrop: ({ source }) => handleDrop(source.data as PdndData),
    });
  }, [validateDrop, handleDragEnter, handleDragLeave, handleDrop]);

  return {
    ref: ref as React.RefObject<HTMLDivElement>,
    ...dropState,
  };
}

// ============ UTILITIES ============
export const pdndUtils = {
  // Get Tailwind classes for drag state
  getDragClasses: (isDragging: boolean, disabled: boolean = false) => {
    if (disabled) return 'cursor-not-allowed opacity-50';
    if (isDragging) return 'opacity-50 scale-95 cursor-grabbing z-50';
    return 'cursor-grab hover:-translate-y-0.5 transition-all duration-200';
  },

  // Get Tailwind classes for drop state
  getDropClasses: (hoverState: PdndHoverState) => {
    const baseClasses = 'border-2 border-dashed rounded-lg transition-all duration-200';
    switch (hoverState) {
      case 'validDrop':
        return `${baseClasses} border-green-400 bg-green-50`;
      case 'invalidDrop':
        return `${baseClasses} border-red-400 bg-red-50`;
      default:
        return `${baseClasses} border-gray-300 bg-transparent`;
    }
  },

  // Validate drag data
  validateData: (data: any): data is PdndData => {
    return data && typeof data.id === 'string' && typeof data.type === 'string';
  },

  // Create consistent drag data
  createDragData: (id: string, type: string, extraData: Record<string, any> = {}): PdndData => ({
    id,
    type,
    ...extraData,
  }),
};