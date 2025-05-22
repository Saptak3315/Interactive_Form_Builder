// src/components/FormBuilder/Core/DraggableQuestionType.tsx

import React from "react";
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
      className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-md cursor-grab transition-all duration-200 select-none hover:border-indigo-500 hover:bg-indigo-50 hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing active:translate-y-0 group"
      draggable={true}
      onDragStart={handleDragStart}
      onClick={handleClick}
      title={`${questionType.description} (Click or drag to add)`}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center justify-center w-8 h-8 text-xl bg-slate-100 rounded-md group-hover:bg-indigo-100">
          {questionType.icon}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-slate-800 group-hover:text-indigo-800">
            {questionType.label}
          </span>
          <span className="text-xs text-slate-500 leading-tight group-hover:text-indigo-600">
            {questionType.description}
          </span>
        </div>
      </div>
      <div className="text-slate-400 font-bold text-base opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        ⋯
      </div>
    </div>
  );
};

export default DraggableQuestionType;