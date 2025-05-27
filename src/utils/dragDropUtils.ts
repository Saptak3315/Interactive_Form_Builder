// src/utils/dragDropUtils.ts

import type { Question } from '../types/form.types';

// Symbols for different drag data types
const questionCardKey = Symbol('question-card');
const questionDropTargetKey = Symbol('question-drop-target');
const newQuestionTypeKey = Symbol('new-question-type');

// Type definitions
export type QuestionCardData = {
  [questionCardKey]: true;
  question: Question;
  rect: DOMRect;
};

export type QuestionDropTargetData = {
  [questionDropTargetKey]: true;
  question: Question;
};

export type NewQuestionTypeData = {
  [newQuestionTypeKey]: true;
  questionType: string;
  label: string;
  rect: DOMRect;
};

// Helper functions for QuestionCard
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

// Helper functions for QuestionDropTarget
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

// Helper functions for NewQuestionType
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

// Universal drag detection
export function isDraggingAQuestion({
  source,
}: {
  source: { data: Record<string | symbol, unknown> };
}): boolean {
  return isQuestionCardData(source.data) || isNewQuestionTypeData(source.data);
}

// Utility to safely extract question data from drop events
export function extractQuestionFromDrop(
  data: Record<string | symbol, unknown>
): Question | null {
  if (isQuestionCardData(data)) {
    return data.question;
  }
  return null;
}

// Utility to extract question type from new question drops
export function extractQuestionTypeFromDrop(
  data: Record<string | symbol, unknown>
): string | null {
  if (isNewQuestionTypeData(data)) {
    return data.questionType;
  }
  return null;
}

// Utility to check if drag operation is a reorder vs new question
export function isDragReorder(
  data: Record<string | symbol, unknown>
): boolean {
  return isQuestionCardData(data);
}

export function isDragNewQuestion(
  data: Record<string | symbol, unknown>
): boolean {
  return isNewQuestionTypeData(data);
}