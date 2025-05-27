// src/components/FormBuilder/Core/QuestionEditor.tsx

import React, { useState, useEffect } from 'react';
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
  isDraggingAQuestion,
  type QuestionCardData,
  type QuestionDropTargetData,
  type NewQuestionTypeData
} from './QuestionCard';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import Swal from 'sweetalert2';
import { useRef } from 'react';
import invariant from 'tiny-invariant';

const QuestionEditor: React.FC = () => {
  const { state, dispatch } = useFormContext();
  const [forceUpdate, setForceUpdate] = useState(0);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);

  // Add an effect to log questions when they change and force re-render
  useEffect(() => {
    console.log("QuestionEditor questions updated:", state.questions);
    setForceUpdate(prev => prev + 1);
  }, [state.questions]);

  // Monitor for drag and drop operations
  useEffect(() => {
    return monitorForElements({
      canMonitor: isDraggingAQuestion,
      onDrop({ source, location }) {
        const dragging = source.data;
        
        // Handle new question type drops
        if (isNewQuestionTypeData(dragging)) {
          console.log('Dropping new question type:', dragging.questionType);
          
          // Check if dropped on an existing question
          const targetDropData = location.current.dropTargets.find(target => 
            isQuestionDropTargetData(target.data)
          );
          
          if (targetDropData && isQuestionDropTargetData(targetDropData.data)) {
            // Insert before/after an existing question
            const targetQuestion = targetDropData.data.question;
            const targetIndex = state.questions.findIndex(q => q.id === targetQuestion.id);
            const closestEdge = extractClosestEdge(targetDropData.data);
            
            let insertIndex = targetIndex;
            if (closestEdge === 'bottom') {
              insertIndex = targetIndex + 1;
            }
            
            const newQuestion = createDefaultQuestion(
              dragging.questionType as any,
              insertIndex
            );
            
            // Reorder all questions to accommodate the new one
            const newQuestions = [...state.questions];
            newQuestions.splice(insertIndex, 0, { ...newQuestion, id: Math.floor(Math.random() * 100000) });
            
            // Update order positions
            const reorderedQuestions = newQuestions.map((question, index) => ({
              ...question,
              orderPosition: index
            }));
            
            dispatch(reorderQuestions(reorderedQuestions));
            dispatch(setActiveQuestion(reorderedQuestions[insertIndex].id));
          } else {
            // Drop at the end
            const orderPosition = state.questions.length;
            const newQuestion = createDefaultQuestion(
              dragging.questionType as any,
              orderPosition
            );
            dispatch(addQuestion(newQuestion));
          }
          return;
        }
        
        // Handle question reordering
        if (isQuestionCardData(dragging)) {
          const innerMost = location.current.dropTargets[0];
          if (!innerMost) return;

          const dropTargetData = innerMost.data;
          if (!isQuestionDropTargetData(dropTargetData)) return;

          const startIndex = state.questions.findIndex(q => q.id === dragging.question.id);
          const finishIndex = state.questions.findIndex(q => q.id === dropTargetData.question.id);

          if (startIndex === -1 || finishIndex === -1) return;
          if (startIndex === finishIndex) return;

          const closestEdge = extractClosestEdge(dropTargetData);
          const reordered = reorderWithEdge({
            axis: 'vertical',
            list: state.questions,
            startIndex,
            indexOfTarget: finishIndex,
            closestEdgeOfTarget: closestEdge,
          });

          // Update order positions
          const reorderedWithPositions = reordered.map((question, index) => ({
            ...question,
            orderPosition: index
          }));

          dispatch(reorderQuestions(reorderedWithPositions));
        }
      },
    });
  }, [state.questions, dispatch]);

  // Set up drop zone for empty area
  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    return dropTargetForElements({
      element: dropZone,
      canDrop: ({ source }) => isNewQuestionTypeData(source.data),
      onDrop({ source }) {
        if (isNewQuestionTypeData(source.data)) {
          console.log('Dropping new question type in empty area:', source.data.questionType);
          const orderPosition = state.questions.length;
          const newQuestion = createDefaultQuestion(
            source.data.questionType as any,
            orderPosition
          );
          dispatch(addQuestion(newQuestion));
        }
      },
    });
  }, [state.questions.length, dispatch]);

  // Handle question selection
  const handleQuestionSelect = (questionId: number) => {
    dispatch(setActiveQuestion(questionId));
  };

  // Handle question deletion
  const handleQuestionDelete = (questionId: number, questionTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${questionTitle || 'this question'}"?`)) {
      dispatch(deleteQuestion(questionId));
    }
  };

  console.log("QuestionEditor rendering with state:", {
    questionsCount: state.questions.length,
    forceUpdate,
    activeQuestionId: state.activeQuestionId
  });

  if (state.questions.length === 0) {
    return (
      <div 
        ref={dropZoneRef}
        className="flex items-center justify-center h-full transition-all duration-200 border-2 border-dashed rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-indigo-300"
        style={{ minHeight: "400px" }}
      >
        <div className="text-center text-slate-600 p-10">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="mb-2 text-slate-800 text-xl font-semibold">Start building your form</h3>
          <p className="mb-5 text-base">Drag question types from the sidebar or click them to add</p>
          <div className="px-6 py-3 bg-blue-50 border border-dashed border-blue-300 rounded-md text-blue-800 font-medium">
            <span>Drop question types here</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-5 transition-all duration-200">
      {/* Questions List */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {state.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            isActive={state.activeQuestionId === question.id}
            onSelect={handleQuestionSelect}
            onDelete={handleQuestionDelete}
          />
        ))}
      </div>

      {/* Drop Zone for Adding Questions at End */}
      <div
        ref={dropZoneRef}
        className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-400 bg-gray-50 transition-all duration-200 flex flex-col items-center gap-3 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
        style={{ minHeight: "80px" }}
      >
        <span>Drop new questions here or</span>
        <button
          className="px-5 py-2.5 bg-indigo-500 text-white border-none rounded-md font-medium cursor-pointer transition-all duration-200 hover:bg-indigo-600 hover:-translate-y-0.5"
          onClick={() => {
            Swal.fire('Question type selector coming soon!');
          }}
        >
          + Add Question
        </button>
      </div>
    </div>
  );
};

export default QuestionEditor;