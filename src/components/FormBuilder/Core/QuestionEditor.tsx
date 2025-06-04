// src/components/FormBuilder/Core/QuestionEditor.tsx

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useFormContext } from '../../../context/FormContext/FormProvider';
import {
  addQuestion,
  createDefaultQuestion,
  deleteQuestion,
  setActiveQuestion,
  reorderQuestions
} from '../../../context/FormContext/formActions';
import { 
  QuestionCard, 
  isQuestionCardData, 
  isQuestionDropTargetData, 
  isNewQuestionTypeData,
  isDraggingAQuestion
} from './QuestionCard';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import Swal from 'sweetalert2';

const QuestionEditor: React.FC = () => {
  const { state, dispatch } = useFormContext();
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const monitorsInitialized = useRef<boolean>(false);
  const questionRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  
  // Track user interactions and component initialization
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isDragInProgress, setIsDragInProgress] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActiveQuestionRef = useRef<number | null>(null);
  
  // Track drag state for better UX
  const [isNewQuestionDragActive, setIsNewQuestionDragActive] = useState(false);
  const [recentlyAddedQuestionId, setRecentlyAddedQuestionId] = useState<number | null>(null);
  
  // NEW: Track scroll position when adding questions
  const scrollPositionBeforeAdd = useRef<number>(0);
  const shouldAutoScroll = useRef<boolean>(true);
  
  // Create a stable key that changes when form structure changes significantly
  const formStateKey = useMemo(() => {
    return `${state.formId || 'new'}-${state.questions.length}-${Date.now()}`;
  }, [state.formId, state.questions.length]);

  // Register question refs for auto-scrolling
  const registerQuestionRef = useCallback((questionId: number, element: HTMLDivElement | null) => {
    if (element) {
      questionRefs.current.set(questionId, element);
    } else {
      questionRefs.current.delete(questionId);
    }
  }, []);

  // Check if user is near the bottom of the scroll container
  const isNearBottom = useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return false;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const scrollBottom = scrollTop + clientHeight;
    const threshold = 100; // 100px from bottom is considered "near bottom"
    
    const nearBottom = scrollHeight - scrollBottom <= threshold;
    console.log('isNearBottom check:', {
      scrollTop,
      scrollHeight,
      clientHeight,
      scrollBottom,
      threshold,
      nearBottom
    });
    
    return nearBottom;
  }, []);

  // COMPLETELY REWRITTEN: Smart scroll function that respects user position
  const scrollToQuestionIfNeeded = useCallback((questionId: number, context: 'initial' | 'new_question' | 'manual') => {
    console.log(`scrollToQuestionIfNeeded called: ${questionId}, context: ${context}, shouldAutoScroll: ${shouldAutoScroll.current}`);
    
    // Don't scroll if user is currently scrolling or dragging
    if (isUserScrolling || isDragInProgress) {
      console.log('Auto-scroll prevented: user interaction in progress');
      return;
    }

    // Don't scroll if we explicitly disabled it
    if (!shouldAutoScroll.current && context === 'new_question') {
      console.log('Auto-scroll prevented: shouldAutoScroll is false');
      shouldAutoScroll.current = true; // Reset for next time
      return;
    }

    const questionElement = questionRefs.current.get(questionId);
    const scrollContainer = scrollContainerRef.current;
    
    if (!questionElement || !scrollContainer) {
      console.log('Auto-scroll prevented: missing elements');
      return;
    }

    // For new questions, check if we should skip scrolling
    if (context === 'new_question') {
      // If user was near bottom when adding at end, don't scroll
      const wasNearBottom = scrollPositionBeforeAdd.current;
      if (wasNearBottom) {
        console.log('Auto-scroll prevented: user was near bottom when question was added');
        return;
      }
    }

    try {
      console.log(`Auto-scrolling to question ${questionId} (context: ${context})`);
      questionElement.scrollIntoView({
        behavior: context === 'initial' ? 'auto' : 'smooth', // Instant for initial load
        block: 'center',
        inline: 'nearest'
      });
    } catch (error) {
      console.error('Error during auto-scroll:', error);
    }
  }, [isUserScrolling, isDragInProgress]);

  // Track user scrolling to prevent auto-scroll conflicts
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      setIsUserScrolling(true);
      
      // Clear existing timeout
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
      
      // Reset user scrolling flag after delay
      userScrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
      }, 1000); // 1 second delay
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, []);

  // REWRITTEN: Much simpler auto-scroll logic
  useEffect(() => {
    if (state.activeQuestionId) {
      // Case 1: Initial load (page refresh) - always scroll, but instantly
      if (isInitialLoad) {
        console.log('Initial load: scrolling to active question', state.activeQuestionId);
        setTimeout(() => scrollToQuestionIfNeeded(state.activeQuestionId!, 'initial'), 300);
        setIsInitialLoad(false);
        lastActiveQuestionRef.current = state.activeQuestionId;
        return;
      }

      // Case 2: New question added - smart scroll decision
      if (lastActiveQuestionRef.current !== state.activeQuestionId) {
        // Check if this is a newly added question
        if (recentlyAddedQuestionId === state.activeQuestionId) {
          console.log('New question added: checking if should scroll to', state.activeQuestionId);
          setTimeout(() => scrollToQuestionIfNeeded(state.activeQuestionId!, 'new_question'), 200);
        }
        lastActiveQuestionRef.current = state.activeQuestionId;
      }
    } else {
      // No active question
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
      lastActiveQuestionRef.current = null;
    }
  }, [state.activeQuestionId, isInitialLoad, recentlyAddedQuestionId, scrollToQuestionIfNeeded]);

  // Enhanced add question function with scroll position tracking
  const addQuestionAtPosition = useCallback((questionType: string, insertIndex?: number) => {
    console.log('Adding question:', { questionType, insertIndex, currentLength: state.questions.length });
    
    // CRITICAL: Capture scroll state BEFORE adding the question
    const wasNearBottom = isNearBottom();
    const isAddingAtEnd = insertIndex === undefined || insertIndex >= state.questions.length;
    
    console.log('Scroll state before adding question:', {
      wasNearBottom,
      isAddingAtEnd,
      insertIndex,
      currentLength: state.questions.length
    });
    
    // Set scroll behavior based on position
    if (isAddingAtEnd && wasNearBottom) {
      console.log('Adding at end while user is near bottom - DISABLING auto-scroll');
      shouldAutoScroll.current = false;
      scrollPositionBeforeAdd.current = 1; // Mark as "was near bottom"
    } else {
      console.log('Normal add - auto-scroll enabled');
      shouldAutoScroll.current = true;
      scrollPositionBeforeAdd.current = 0; // Mark as "was not near bottom"
    }
    
    const currentQuestions = state.questions;
    const orderPosition = insertIndex !== undefined ? insertIndex : currentQuestions.length;
    const newQuestion = createDefaultQuestion(questionType as any, orderPosition);
    const newQuestionId = Math.floor(Math.random() * 100000);
    const questionWithId = { ...newQuestion, id: newQuestionId };
    
    if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= currentQuestions.length) {
      // Insert at specific position
      const newQuestions = [...currentQuestions];
      newQuestions.splice(insertIndex, 0, questionWithId);
      
      // Update order positions for all questions
      const reorderedQuestions = newQuestions.map((question, index) => ({
        ...question,
        orderPosition: index
      }));
      
      dispatch(reorderQuestions(reorderedQuestions));
      dispatch(setActiveQuestion(newQuestionId));
      
      console.log('Question inserted at position:', insertIndex, 'New array length:', reorderedQuestions.length);
    } else {
      // Add at end
      dispatch(addQuestion(questionWithId));
      console.log('Question added at end, new length:', currentQuestions.length + 1);
    }
    
    // Mark as recently added for auto-scroll detection
    setRecentlyAddedQuestionId(newQuestionId);
    setTimeout(() => setRecentlyAddedQuestionId(null), 1000);
  }, [dispatch, state.questions, isNearBottom]);

  // Auto-scroll setup - stable reference
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    return autoScrollForElements({
      element: scrollContainer,
      canScroll: ({ source }) => isDraggingAQuestion({ source }),
      getAllowedAxis: () => 'vertical',
    });
  }, [formStateKey]);

  // Enhanced drag monitor with better debugging and error handling
  useEffect(() => {
    console.log('Setting up enhanced drag monitors for form:', state.formId, 'questions:', state.questions.length);
    
    const cleanup = monitorForElements({
      canMonitor: isDraggingAQuestion,
      onDragStart({ source }) {
        console.log('Drag started:', source.data);
        setIsDragInProgress(true);
        
        if (isNewQuestionTypeData(source.data)) {
          setIsNewQuestionDragActive(true);
        }
      },
      onDrop({ source, location }) {
        console.log('Drop event:', { source: source.data, location });
        
        // Reset UI state first
        setIsDragInProgress(false);
        if (isNewQuestionTypeData(source.data)) {
          setIsNewQuestionDragActive(false);
        }

        const dragging = source.data;

        try {
          // Handle new question drops with positional insertion
          if (isNewQuestionTypeData(dragging)) {
            console.log('Processing new question drop:', dragging.questionType);
            
            // CRITICAL: Capture scroll state BEFORE processing drop
            const wasNearBottom = isNearBottom();
            
            // Check if dropped on main drop zone (at end)
            const isDropZoneDrop = location.current.dropTargets.some(target => 
              target.element === dropZoneRef.current
            );
            
            if (isDropZoneDrop) {
              console.log('Dropping in main drop zone - adding at end, wasNearBottom:', wasNearBottom);
              
              // If user is near bottom and dropping at end, disable auto-scroll
              if (wasNearBottom) {
                shouldAutoScroll.current = false;
                scrollPositionBeforeAdd.current = 1;
              }
              
              setTimeout(() => addQuestionAtPosition(dragging.questionType), 0);
              return;
            }
            
            // Handle insertion between questions
            const targetDropData = location.current.dropTargets.find(target => 
              isQuestionDropTargetData(target.data)
            );
            
            if (targetDropData && isQuestionDropTargetData(targetDropData.data)) {
              console.log('Dropping between questions');
              const targetQuestion = targetDropData.data.question;
              const currentQuestions = state.questions;
              const targetIndex = currentQuestions.findIndex(q => q.id === targetQuestion.id);
              
              if (targetIndex === -1) {
                console.error('Target question not found in current questions array');
                return;
              }
              
              const closestEdge = extractClosestEdge(targetDropData.data);
              let insertIndex = targetIndex;
              
              if (closestEdge === 'bottom') {
                insertIndex = targetIndex + 1;
              }
              
              console.log('Calculated insert position:', {
                targetIndex,
                closestEdge,
                insertIndex,
                totalQuestions: currentQuestions.length,
                wasNearBottom
              });
              
              // For insertion, check if inserting at bottom while user is near bottom
              if (insertIndex >= currentQuestions.length && wasNearBottom) {
                console.log('Inserting at end while near bottom - disabling auto-scroll');
                shouldAutoScroll.current = false;
                scrollPositionBeforeAdd.current = 1;
              }
              
              // Validate insert index
              if (insertIndex >= 0 && insertIndex <= currentQuestions.length) {
                setTimeout(() => addQuestionAtPosition(dragging.questionType, insertIndex), 0);
              } else {
                console.error('Invalid insert index calculated:', insertIndex);
                // Fallback to adding at end
                setTimeout(() => addQuestionAtPosition(dragging.questionType), 0);
              }
            }
            return;
          }

          // Handle question reordering with validation
          if (isQuestionCardData(dragging)) {
            console.log('Processing question reorder');
            const innerMost = location.current.dropTargets[0];
            if (!innerMost) {
              console.log('No drop target found for reorder');
              return;
            }

            const dropTargetData = innerMost.data;
            if (!isQuestionDropTargetData(dropTargetData)) {
              console.log('Invalid drop target data for reorder');
              return;
            }

            const currentQuestions = state.questions;
            const startIndex = currentQuestions.findIndex(q => q.id === dragging.question.id);
            const finishIndex = currentQuestions.findIndex(q => q.id === dropTargetData.question.id);

            if (startIndex === -1 || finishIndex === -1) {
              console.error('Invalid question indices for reorder:', { startIndex, finishIndex });
              return;
            }
            
            if (startIndex === finishIndex) {
              console.log('Same position, no reorder needed');
              return;
            }

            const closestEdge = extractClosestEdge(dropTargetData);
            const reordered = reorderWithEdge({
              axis: 'vertical',
              list: currentQuestions,
              startIndex,
              indexOfTarget: finishIndex,
              closestEdgeOfTarget: closestEdge,
            });

            const reorderedWithPositions = reordered.map((question, index) => ({
              ...question,
              orderPosition: index
            }));

            console.log('Reordering questions:', {
              from: startIndex,
              to: finishIndex,
              edge: closestEdge,
              newLength: reorderedWithPositions.length
            });

            // For reordering, don't auto-scroll to maintain user's position
            shouldAutoScroll.current = false;

            dispatch(reorderQuestions(reorderedWithPositions));
          }
        } catch (error) {
          console.error('Error handling drop:', error);
          Swal.fire('Error', 'Failed to process drop operation. Please try again.', 'error');
        }
      },
    });

    monitorsInitialized.current = true;
    return cleanup;
  }, [formStateKey, addQuestionAtPosition, state.questions, isNearBottom]);

  // Enhanced drop zone setup
  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    console.log('Setting up enhanced drop zone for form:', state.formId);
    
    return dropTargetForElements({
      element: dropZone,
      canDrop: ({ source }) => {
        const canDrop = isNewQuestionTypeData(source.data);
        console.log('Drop zone canDrop check:', canDrop, source.data);
        return canDrop;
      },
      getData: () => ({ dropZone: true }),
      onDragEnter: ({ source }) => {
        if (isNewQuestionTypeData(source.data)) {
          console.log('Entered main drop zone');
          setIsNewQuestionDragActive(true);
        }
      },
      onDragLeave: ({ source }) => {
        if (isNewQuestionTypeData(source.data)) {
          console.log('Left main drop zone');
          setIsNewQuestionDragActive(false);
        }
      },
    });
  }, [formStateKey]);

  // Question selection with toggle functionality (NO auto-scroll on manual selection)
  const handleQuestionSelect = useCallback((questionId: number) => {
    console.log('Question selection triggered:', questionId, 'Current active:', state.activeQuestionId);
    
    if (state.activeQuestionId === questionId) {
      // Toggle off - deactivate the question
      console.log('Toggling off active question:', questionId);
      dispatch(setActiveQuestion(null));
    } else {
      // Select new question (no auto-scroll for manual selection)
      console.log('Selecting question:', questionId);
      dispatch(setActiveQuestion(questionId));
    }
  }, [dispatch, state.activeQuestionId]);

  const handleQuestionDelete = useCallback((questionId: number, questionTitle: string) => {
    Swal.fire({
      title: 'Delete Question?',
      text: `Are you sure you want to delete "${questionTitle || 'this question'}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteQuestion(questionId));
        Swal.fire('Deleted!', 'Question has been deleted.', 'success');
      }
    });
  }, [dispatch]);

  // Debug logging
  useEffect(() => {
    console.log('QuestionEditor state changed:', {
      formId: state.formId,
      questionsCount: state.questions.length,
      activeQuestionId: state.activeQuestionId,
      monitorsInitialized: monitorsInitialized.current,
      isNewQuestionDragActive,
      isUserScrolling,
      isDragInProgress,
      isInitialLoad,
      recentlyAddedQuestionId,
      shouldAutoScroll: shouldAutoScroll.current
    });
  }, [state.formId, state.questions.length, state.activeQuestionId, isNewQuestionDragActive, isUserScrolling, isDragInProgress, isInitialLoad, recentlyAddedQuestionId]);

  return (
    <div key={`editor-${formStateKey}`} className="h-full flex flex-col gap-5">
      <div 
        ref={scrollContainerRef}
        className="flex-1 flex flex-col gap-3 overflow-y-auto"
      >
        {state.questions.map((question, index) => (
          <div 
            key={`${question.id}-${formStateKey}`}
            className={`transition-all duration-500 ${
              recentlyAddedQuestionId === question.id 
                ? 'animate-pulse scale-105 shadow-lg shadow-indigo-200' 
                : ''
            }`}
          >
            <QuestionCard
              question={question}
              index={index}
              isActive={state.activeQuestionId === question.id}
              onSelect={handleQuestionSelect}
              onDelete={handleQuestionDelete}
              registerRef={registerQuestionRef}
            />
          </div>
        ))}
      </div>

    </div>
  );
};

export default QuestionEditor;