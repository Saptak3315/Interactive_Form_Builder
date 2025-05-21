// src/components/FormBuilder/Core/QuestionEditor.tsx

import React, { useState, useEffect } from 'react';
import './QuestionEditor.css';
import { useFormContext } from '../../../context/FormContext/FormProvider';
import { 
  addQuestion, 
  createDefaultQuestion, 
  deleteQuestion, 
  setActiveQuestion,
  reorderQuestions
} from '../../../context/FormContext/formActions';

const QuestionEditor: React.FC = () => {
  const { state, dispatch } = useFormContext();
  const [dragOver, setDragOver] = useState(false);
  const [draggedQuestion, setDraggedQuestion] = useState<number | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0); // Added to force re-renders when needed

  // Add an effect to log questions when they change and force re-render
  useEffect(() => {
    console.log("QuestionEditor questions updated:", state.questions);
    // Force a re-render when questions change
    setForceUpdate(prev => prev + 1);
  }, [state.questions]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    console.log('Drop event triggered');

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      console.log('Dropped data:', data);
      
      if (data.type === 'question-type') {
        const orderPosition = state.questions.length;
        const newQuestion = createDefaultQuestion(data.questionType, orderPosition);
        console.log('New question created:', newQuestion);
        dispatch(addQuestion(newQuestion));
        console.log('Question added to state, questions count after adding:', state.questions.length + 1);
        
        // Force immediate re-render
        setForceUpdate(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error parsing drop data:', error);
    }
  };

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

  // Handle question drag start for reordering
  const handleQuestionDragStart = (e: React.DragEvent, questionId: number) => {
    setDraggedQuestion(questionId);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'question-reorder',
      questionId
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle question drop for reordering
  const handleQuestionDrop = (e: React.DragEvent, targetQuestionId: number) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (data.type === 'question-reorder' && data.questionId !== targetQuestionId) {
        const draggedIndex = state.questions.findIndex(q => q.id === data.questionId);
        const targetIndex = state.questions.findIndex(q => q.id === targetQuestionId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
          const newQuestions = [...state.questions];
          const [draggedQuestion] = newQuestions.splice(draggedIndex, 1);
          newQuestions.splice(targetIndex, 0, draggedQuestion);
          
          // Update order positions
          const reorderedQuestions = newQuestions.map((question, index) => ({
            ...question,
            orderPosition: index
          }));
          
          dispatch(reorderQuestions(reorderedQuestions));
        }
      }
    } catch (error) {
      console.error('Error reordering questions:', error);
    }

    setDraggedQuestion(null);
  };

  const handleQuestionDragEnd = () => {
    setDraggedQuestion(null);
  };

  const renderQuestions = () => {
    console.log("Rendering questions:", state.questions); // Debug log
    
    return state.questions.map((question, index) => (
      <div 
        key={question.id} 
        className={`question-item ${state.activeQuestionId === question.id ? 'active' : ''} ${
          draggedQuestion === question.id ? 'dragging' : ''
        }`}
        onClick={() => handleQuestionSelect(question.id)}
        draggable={true}
        onDragStart={(e) => handleQuestionDragStart(e, question.id)}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => handleQuestionDrop(e, question.id)}
        onDragEnd={handleQuestionDragEnd}
      >
        <div className="question-item-header">
          <div className="question-left">
            <span className="drag-handle">⋮⋮</span>
            <span className="question-number">{index + 1}.</span>
            <span className="question-type-badge">{question.type}</span>
          </div>
          <div className="question-actions">
            <button
              className="question-action-btn duplicate-btn"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement duplicate functionality
                alert('Duplicate functionality coming soon!');
              }}
              title="Duplicate question"
            >
              📋
            </button>
            <button
              className="question-action-btn delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleQuestionDelete(question.id, question.content);
              }}
              title="Delete question"
            >
              🗑️
            </button>
          </div>
        </div>
        <div className="question-content">
          <div className="question-text">
            {question.content || `Question ${index + 1}`}
            {question.isRequired && <span className="required-indicator">*</span>}
          </div>
          
          {/* Text type specific preview */}
          {question.type === 'text' && (
            <div className="text-preview">
              <input 
                type="text" 
                className="text-preview-input" 
                disabled 
                placeholder={question.placeholder || "Text input field"}
              />
            </div>
          )}
          
          {question.explanation && (
            <div className="question-explanation">
              {question.explanation}
            </div>
          )}
          
          {question.options && question.options.length > 0 && (
            <div className="question-options-preview">
              {question.options.slice(0, 3).map((option, optIndex) => (
                <div key={option.id} className="option-preview">
                  • {option.content || `Option ${optIndex + 1}`}
                </div>
              ))}
              {question.options.length > 3 && (
                <div className="option-preview more-options">
                  +{question.options.length - 3} more options
                </div>
              )}
            </div>
          )}
        </div>
        <div className="question-metadata">
          <span className="question-points">
            {question.points ? `${question.points} pts` : 'No scoring'}
          </span>
          {question.mediaUrl && (
            <span className="question-media">📎 Media attached</span>
          )}
        </div>
      </div>
    ));
  };

  // Output debugging information
  console.log("QuestionEditor rendering with state:", {
    questionsCount: state.questions.length,
    forceUpdate,
    activeQuestionId: state.activeQuestionId
  });

  if (state.questions.length === 0) {
    return (
      <div 
        key={`empty-editor-${forceUpdate}`}
        className={`question-editor-placeholder ${dragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="placeholder-content">
          <div className="placeholder-icon">📝</div>
          <h3>Start building your form</h3>
          <p>Drag question types from the sidebar or click them to add</p>
          <div className="drop-zone-indicator">
            <span>Drop question types here</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      key={`editor-${forceUpdate}-${state.questions.length}`}
      className={`question-editor ${dragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="questions-list">
        {renderQuestions()}
      </div>
      
      <div className="add-question-zone">
        <div className="drop-zone">
          <span>Drop new questions here or</span>
          <button 
            className="add-question-btn"
            onClick={() => {
              // Open question type selector
              alert('Question type selector coming soon!');
            }}
          >
            + Add Question
          </button>
        </div>
      </div>
      
      {/* Debug button to check state */}
      <button 
        style={{
          position: 'absolute', 
          bottom: '10px', 
          right: '10px',
          padding: '5px',
          background: '#f0f0f0',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 100
        }}
        onClick={() => console.log('Current state:', state)}
      >
        Debug State
      </button>
    </div>
  );
};

export default QuestionEditor;