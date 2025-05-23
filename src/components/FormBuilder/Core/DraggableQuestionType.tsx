// src/components/FormBuilder/Core/DraggableQuestionType.tsx

import React from "react";
import { useFormContext } from "../../../context/FormContext/FormProvider";
import {
  addQuestion,
  createDefaultQuestion,
} from "../../../context/FormContext/formActions";
import { PdndDraggable } from "../../../utils/pdnd-components";
import { pdndUtils } from "../../../utils/pdnd-core";

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

  // Create PDND compatible drag data
  const dragData = pdndUtils.createDragData(
    `question-type-${questionType.type}`,
    'question-type',
    {
      questionType: questionType.type,
      label: questionType.label,
      icon: questionType.icon,
      description: questionType.description
    }
  );

  const handleDragStart = () => {
    console.log(`Starting PDND drag for ${questionType.type} question`);
  };

  const handleDragEnd = () => {
    console.log(`Ended PDND drag for ${questionType.type} question`);
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
    <PdndDraggable
      dragData={dragData}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-md transition-all duration-200 select-none hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md group"
    >
      <div 
        onClick={handleClick}
        className="flex items-center gap-3 flex-1 cursor-pointer"
        title={`${questionType.description} (Click or drag to add)`}
      >
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
    </PdndDraggable>
  );
};

export default DraggableQuestionType;