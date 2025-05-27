// src/utils/pdnd-template/types.ts
export type TCard = {
  id: string;
  description: string;
};

export type TColumn = {
  id: string;
  title: string;
  cards: TCard[];
};

// Data symbols and types for drag/drop
const cardKey = Symbol('card');
export type TCardData = {
  [cardKey]: true;
  card: TCard;
  columnId: string;
  rect: DOMRect;
};

const cardDropTargetKey = Symbol('card-drop-target');
export type TCardDropTargetData = {
  [cardDropTargetKey]: true;
  card: TCard;
  columnId: string;
};

// Helper functions
export function getCardData({
  card,
  rect,
  columnId,
}: Omit<TCardData, typeof cardKey>): TCardData {
  return {
    [cardKey]: true,
    rect,
    card,
    columnId,
  };
}

export function isCardData(value: Record<string | symbol, unknown>): value is TCardData {
  return Boolean(value[cardKey]);
}

export function getCardDropTargetData({
  card,
  columnId,
}: Omit<TCardDropTargetData, typeof cardDropTargetKey>): TCardDropTargetData {
  return {
    [cardDropTargetKey]: true,
    card,
    columnId,
  };
}

export function isCardDropTargetData(
  value: Record<string | symbol, unknown>,
): value is TCardDropTargetData {
  return Boolean(value[cardDropTargetKey]);
}

export function isDraggingACard({
  source,
}: {
  source: { data: Record<string | symbol, unknown> };
}): boolean {
  return isCardData(source.data);
}