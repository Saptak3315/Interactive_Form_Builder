// src/components/FormBuilder/Core/QuestionEditor.tsx

import React, { useState } from 'react';
import './QuestionEditor.css';
import { useFormContext } from '../../../context/FormContext/FormProvider';
import { addQuestion, createDefaultQuestion } from '../../../context/FormContext/formActions';

const QuestionEditor: React.FC = () => {
  const { state, dispatch } = useFormContext();
  const [dragOver, setDragOver] = useState(false);

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

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (data.type === 'question-type') {
        const orderPosition = state.questions.length;
        const newQuestion = createDefaultQuestion(data.questionType, orderPosition);
        dispatch(addQuestion(newQuestion));
      }
    } catch (error) {
      console.error('Error parsing drop data:', error);
    }
  };

  if (state.questions.length === 0) {
    return (
      <div 
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
      className={`question-editor ${dragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="questions-list">
        {state.questions.map((question, index) => (
          <div key={question.id} className="question-item">
            <div className="question-item-header">
              <span className="question-number">{index + 1}.</span>
              <span className="question-type">{question.type}</span>
            </div>
            <div className="question-content">
              {question.content || `Question ${index + 1}`}
            </div>
          </div>
        ))}
      </div>
      
      <div className="drop-zone">
        <span>Drop new questions here</span>
      </div>
    </div>
  );
};

export default QuestionEditor;