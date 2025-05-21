// src/components/FormBuilder/Core/DraggableQuestionType.tsx

import React from "react";
import "./DraggableQuestionType.css";
import { useFormContext } from "../../../context/FormContext/FormProvider";
import {
  addQuestion,
  createDefaultQuestion,
} from "../../../context/FormContext/formActions";

interface QuestionTypeOption {
  type: string;
  label: string;
  icon: string;
  description: string;
  category: string;
}

interface DraggableQuestionTypeProps {
  questionType: QuestionTypeOption;
}

const DraggableQuestionType: React.FC<DraggableQuestionTypeProps> = ({
  questionType,
}) => {
  const { state, dispatch } = useFormContext();

  const handleDragStart = (e: React.DragEvent) => {
    console.log(`Starting drag for ${questionType.type} question`);
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: "question-type",
        questionType: questionType.type,
      })
    );
    e.dataTransfer.effectAllowed = "copy";

    // Add this to verify the data is being set correctly
    const data = e.dataTransfer.getData("application/json");
    console.log("Drag data set:", data || "No data available during dragStart");
  };

  const handleClick = () => {
    // Fallback for non-drag interaction
    const orderPosition = state.questions.length;
    const newQuestion = createDefaultQuestion(
      questionType.type as any,
      orderPosition
    );
    dispatch(addQuestion(newQuestion));
  };

  return (
    <div
      className="draggable-question-type"
      draggable={true}
      onDragStart={handleDragStart}
      onClick={handleClick}
      title={`${questionType.description} (Click or drag to add)`}
    >
      <div className="question-type-content">
        <span className="question-type-icon">{questionType.icon}</span>
        <div className="question-type-text">
          <span className="question-type-label">{questionType.label}</span>
          <span className="question-type-description">
            {questionType.description}
          </span>
        </div>
      </div>
      <div className="drag-handle">⋯</div>
    </div>
  );
};

export default DraggableQuestionType;
