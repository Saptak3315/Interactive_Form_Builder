// src/utils/pdnd-template/SingleColumnBoard.tsx
'use client';

import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { 
  isCardData, 
  isCardDropTargetData, 
  isDraggingACard,
  type TCard, 
} from './types';
import { Card } from './Card';

interface SingleColumnBoardProps {
  initialCards?: TCard[];
  columnTitle?: string;
  onCardsChange?: (cards: TCard[]) => void;
  onAddCard?: () => void;
  className?: string;
}

export function SingleColumnBoard({ 
  initialCards = [], 
  columnTitle = "Tasks",
  onCardsChange,
  onAddCard,
  className = ""
}: SingleColumnBoardProps) {
  const columnId = 'single-column';
  const [cards, setCards] = useState<TCard[]>(initialCards);

  // Update local state when initialCards changes
  useEffect(() => {
    setCards(initialCards);
  }, [initialCards]);

  useEffect(() => {
    return monitorForElements({
      canMonitor: isDraggingACard,
      onDrop({ source, location }) {
        const dragging = source.data;
        if (!isCardData(dragging)) return;

        const innerMost = location.current.dropTargets[0];
        if (!innerMost) return;

        const dropTargetData = innerMost.data;
        if (!isCardDropTargetData(dropTargetData)) return;

        const startIndex = cards.findIndex(card => card.id === dragging.card.id);
        const finishIndex = cards.findIndex(card => card.id === dropTargetData.card.id);

        if (startIndex === -1 || finishIndex === -1) return;
        if (startIndex === finishIndex) return;

        const closestEdge = extractClosestEdge(dropTargetData);
        const reordered = reorderWithEdge({
          axis: 'vertical',
          list: cards,
          startIndex,
          indexOfTarget: finishIndex,
          closestEdgeOfTarget: closestEdge,
        });

        setCards(reordered);
        onCardsChange?.(reordered);
      },
    });
  }, [cards, onCardsChange]);

  const handleAddCard = () => {
    if (onAddCard) {
      onAddCard();
    } else {
      // Default behavior: add a simple numbered card
      const newCard: TCard = {
        id: `card-${Date.now()}`,
        description: `Card ${cards.length + 1}`,
      };
      const newCards = [...cards, newCard];
      setCards(newCards);
      onCardsChange?.(newCards);
    }
  };

  return (
    <div className={`flex justify-center p-6 ${className}`}>
      <div className="w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Column Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-lg">{columnTitle}</h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
            {cards.length}
          </span>
        </div>

        {/* Cards Container */}
        <div className="max-h-96 overflow-y-auto bg-gray-50">
          {cards.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-sm">No cards yet. Add your first card!</p>
            </div>
          ) : (
            cards.map((card) => (
              <Card key={card.id} card={card} columnId={columnId} />
            ))
          )}
        </div>

        {/* Add Card Button */}
        <div className="p-4 bg-white border-t border-gray-100">
          <button
            type="button"
            onClick={handleAddCard}
            className="w-full flex items-center justify-center gap-2 p-3 text-gray-600 hover:bg-gray-50 hover:text-gray-800 rounded-lg transition-all duration-150 border-2 border-dashed border-gray-200 hover:border-gray-300"
          >
            <Plus size={16} />
            <span className="font-medium">Add a card</span>
          </button>
        </div>
      </div>
    </div>
  );
}