// src/utils/pdnd-components.tsx
import React from 'react';
import { pdndUtils, usePdndDraggable, usePdndDropTarget, type PdndData, type PdndDragOptions, type PdndDropOptions } from './pdnd-core';

// ============ DRAGGABLE COMPONENT ============
interface PdndDraggableProps extends PdndDragOptions {
  dragData: PdndData;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const PdndDraggable: React.FC<PdndDraggableProps> = ({
  dragData,
  children,
  className = '',
  style = {},
  ...options
}) => {
  const { ref, isDragging } = usePdndDraggable(dragData, options);

  const dragClasses = pdndUtils.getDragClasses(isDragging, options.disabled);

  return (
    <div
      ref={ref}
      className={`${dragClasses} ${className}`}
      style={{
        userSelect: 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ============ DROP ZONE COMPONENT ============
interface PdndDropZoneProps extends PdndDropOptions {
  acceptedTypes: string[];
  onItemDrop: (data: PdndData) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  minHeight?: string;
}

export const PdndDropZone: React.FC<PdndDropZoneProps> = ({
  acceptedTypes,
  onItemDrop,
  children,
  className = '',
  style = {},
  minHeight = '100px',
  ...options
}) => {
  const { ref, hoverState } = usePdndDropTarget(acceptedTypes, onItemDrop, options);

  const dropClasses = pdndUtils.getDropClasses(hoverState);

  return (
    <div
      ref={ref}
      className={`${dropClasses} ${className}`}
      style={{
        minHeight,
        padding: '16px',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ============ COMPOUND COMPONENTS ============
interface PdndListItemProps {
  item: PdndData;
  onDragStart?: (data: PdndData) => void;
  onDragEnd?: (data: PdndData) => void;
  children: React.ReactNode;
  className?: string;
}

export const PdndListItem: React.FC<PdndListItemProps> = ({
  item,
  children,
  className = '',
  ...options
}) => (
  <PdndDraggable
    dragData={item}
    className={`p-3 bg-white border rounded-lg shadow-sm ${className}`}
    {...options}
  >
    {children}
  </PdndDraggable>
);

interface PdndContainerProps {
  acceptedTypes: string[];
  onItemDrop: (data: PdndData) => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  emptyMessage?: string;
  canDrop?: (data: PdndData) => boolean;
}

export const PdndContainer: React.FC<PdndContainerProps> = ({
  acceptedTypes,
  onItemDrop,
  children,
  title,
  className = '',
  emptyMessage = 'Drop items here',
  canDrop,
}) => (
  <div className={`w-full ${className}`}>
    {title && (
      <h3 className="text-lg font-semibold mb-3 text-gray-800">{title}</h3>
    )}
    <PdndDropZone
      acceptedTypes={acceptedTypes}
      onItemDrop={onItemDrop}
      className="w-full"
      minHeight="200px"
      canDrop={canDrop}
    >
      {React.Children.count(children) === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </PdndDropZone>
  </div>
);