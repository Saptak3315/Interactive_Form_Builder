// src/components/FormBuilder/Questions/QuestionDetailEditor.tsx

import React, { useState, useEffect } from "react";
import { useFormContext } from "../../../context/FormContext/FormProvider";
import type { Question, QuestionOption } from "../../../types/form.types";
import {
  addOption,
  deleteOption,
  updateOption,
  updateQuestion,
} from "../../../context/FormContext/formActions";

const QuestionDetailEditor: React.FC = () => {
  const { state, dispatch } = useFormContext();
  const activeQuestion = state.questions.find(
    (q) => q.id === state.activeQuestionId
  );

  // Local state for form fields
  const [localQuestion, setLocalQuestion] = useState<Partial<Question>>({});

  // Update local state when active question changes
  useEffect(() => {
    if (activeQuestion) {
      setLocalQuestion(activeQuestion);
    }
  }, [activeQuestion]);

  // Handle field updates
  const handleFieldChange = (field: keyof Question, value: any) => {
    setLocalQuestion((prev) => ({ ...prev, [field]: value }));
  };

  // Save changes to the question
  const saveChanges = () => {
    if (activeQuestion && localQuestion) {
      dispatch(updateQuestion(activeQuestion.id, localQuestion));
    }
  };

  // Handle option changes
  const handleOptionChange = (
    optionId: number,
    field: keyof QuestionOption,
    value: any
  ) => {
    if (!activeQuestion) return;
    dispatch(updateOption(activeQuestion.id, optionId, { [field]: value }));
  };

  const handleAddOption = () => {
    if (!activeQuestion) return;
    const newOption = {
      content: "",
      orderPosition: activeQuestion.options?.length || 0,
      isCorrect: false,
    };
    dispatch(addOption(activeQuestion.id, newOption));
  };

  const handleDeleteOption = (optionId: number) => {
    if (!activeQuestion) return;
    if (activeQuestion.options && activeQuestion.options.length <= 2) {
      alert("A choice question must have at least 2 options");
      return;
    }
    dispatch(deleteOption(activeQuestion.id, optionId));
  };

  if (!activeQuestion) {
    return (
      <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg">
        <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 p-10">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="mb-2 text-slate-800 text-xl">No question selected</h3>
          <p className="text-base">
            Select a question from the editor to start configuring it
          </p>
        </div>
      </div>
    );
  }

  const questionTypeOptions = [
    { value: "text", label: "Short Text" },
    { value: "textarea", label: "Long Text" },
    { value: "number", label: "Number" },
    { value: "multiple_choice", label: "Multiple Choice" },
    { value: "checkbox", label: "Checkboxes" },
    { value: "file", label: "File Upload" },
    { value: "audio", label: "Audio" },
    { value: "calculated", label: "Calculated" },
  ];

  const hasOptions =
    activeQuestion.type === "multiple_choice" ||
    activeQuestion.type === "checkbox";

  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg">
      <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="m-0 text-lg font-semibold text-slate-800">
          Field Details
        </h3>
        <div className="flex gap-2.5">
          <button
            className={`
              px-4 py-2 border-none rounded-md font-medium cursor-pointer transition-all duration-200 flex items-center gap-1.5
              ${
                JSON.stringify(localQuestion) === JSON.stringify(activeQuestion)
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                  : "bg-emerald-500 text-white hover:bg-emerald-600"
              }
            `}
            onClick={saveChanges}
            disabled={
              JSON.stringify(localQuestion) === JSON.stringify(activeQuestion)
            }
          >
            💾 Save Changes
          </button>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        {/* Question Type */}
        <div className="mb-5">
          <label
            htmlFor="question-type"
            className="block mb-1.5 text-sm font-medium text-gray-700"
          >
            Field Type
          </label>
          <select
            id="question-type"
            value={localQuestion.type || ""}
            onChange={(e) => handleFieldChange("type", e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
          >
            {questionTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Question Content */}
        <div className="mb-5">
          <label
            htmlFor="question-content"
            className="block mb-1.5 text-sm font-medium text-gray-700"
          >
            Field Label
          </label>
          <textarea
            id="question-content"
            value={localQuestion.content || ""}
            onChange={(e) => handleFieldChange("content", e.target.value)}
            placeholder="Enter your question..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 resize-vertical min-h-20 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
            rows={3}
          />
        </div>
        

        <div className="mb-5">
          <label htmlFor="question-content" className="block mb-1.5 text-sm font-medium text-gray-700">
            Explanation
          </label>
          <textarea
            id="question-content"
            value={localQuestion.explanation || ""}
            onChange={(e) => handleFieldChange('explanation', e.target.value)}
            placeholder="Enter explanation..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 resize-vertical min-h-20 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
            rows={3}
          />
        </div>
        {/* Required checkbox */}
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="question-required"
              checked={localQuestion.isRequired || false}
              onChange={(e) =>
                handleFieldChange("isRequired", e.target.checked)
              }
              className="w-auto m-0"
            />
            <label
              htmlFor="question-required"
              className="m-0 cursor-pointer select-none text-sm font-medium text-gray-700"
            >
              Required question
            </label>
          </div>
        </div>

        {/* Points field */}
        <div className="mb-5">
          <label
            htmlFor="question-points"
            className="block mb-1.5 text-sm font-medium text-gray-700"
          >
            Points (for scoring)
          </label>
          <input
            type="number"
            id="question-points"
            value={localQuestion.points || ""}
            onChange={(e) =>
              handleFieldChange("points", parseInt(e.target.value) || undefined)
            }
            placeholder="0"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
            min="-100"
          />
        </div>

        {/* Media URL field */}
        <div className="mb-5">
          <label className="block mb-1.5 text-sm font-medium text-gray-700">
            Field Media
          </label>
          <input
            type="url"
            id="question-media"
            value={localQuestion.mediaUrl || ""}
            onChange={(e) => handleFieldChange("mediaUrl", e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
          />
          {localQuestion.mediaUrl && (
            <div className="mt-1.5 p-2 bg-gray-100 rounded">
              <small className="text-gray-500 text-xs">
                Media type will be auto-detected
              </small>
            </div>
          )}
        </div>
        {hasOptions && (
          <div className="mb-5">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Answer Options
              </label>
              <button
                className="px-3 py-1.5 bg-indigo-500 text-white border-none rounded text-xs font-medium cursor-pointer transition-all duration-200 hover:bg-indigo-600"
                onClick={handleAddOption}
              >
                + Add Option
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {activeQuestion.options?.map((option, index) => (
                <div
                  key={option.id}
                  className="p-3 border border-gray-200 rounded-md bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-1 rounded">
                      {index + 1}
                    </span>
                    <button
                      className={`
                        px-2 py-1 border-none rounded cursor-pointer text-xs transition-all duration-200
                        ${
                          activeQuestion.options!.length <= 2
                            ? "opacity-50 cursor-not-allowed bg-red-50 text-red-600"
                            : "bg-red-50 text-red-600 hover:bg-red-100"
                        }
                      `}
                      onClick={() => handleDeleteOption(option.id)}
                      disabled={activeQuestion.options!.length <= 2}
                      title="Delete option"
                    >
                      🗑️
                    </button>
                  </div>

                  <input
                    type="text"
                    value={option.content}
                    onChange={(e) =>
                      handleOptionChange(option.id, "content", e.target.value)
                    }
                    placeholder={`Option ${index + 1}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2 text-sm"
                  />

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`option-correct-${option.id}`}
                        checked={option.isCorrect || false}
                        onChange={(e) =>
                          handleOptionChange(
                            option.id,
                            "isCorrect",
                            e.target.checked
                          )
                        }
                        className="w-auto m-0"
                      />
                      <label
                        htmlFor={`option-correct-${option.id}`}
                        className="m-0 cursor-pointer select-none text-sm font-medium text-gray-700"
                      >
                        Correct answer
                      </label>
                    </div>

                    <input
                      type="number"
                      value={option.points || ""}
                      onChange={(e) =>
                        handleOptionChange(
                          option.id,
                          "points",
                          parseInt(e.target.value) || undefined
                        )
                      }
                      placeholder="Points"
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
                      min="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Text Input Settings */} 
        {activeQuestion.type === "text" && (
          <div className="mb-5">
            <label className="block mb-1.5 text-sm font-medium text-gray-700">
              Text Input Settings
            </label>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Placeholder text"
                value={localQuestion.placeholder || ""}
                onChange={(e) =>
                  handleFieldChange("placeholder", e.target.value)
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Min length"
                  value={localQuestion.minLength || ""}
                  onChange={(e) =>
                    handleFieldChange(
                      "minLength",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  className="w-auto min-w-32 px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                  min="0"
                />
                <input
                  type="number"
                  placeholder="Max length"
                  value={localQuestion.maxLength || ""}
                  onChange={(e) =>
                    handleFieldChange(
                      "maxLength",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  className="w-auto min-w-32 px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                  min="0"
                />
              </div>

              {/* VALIDATION DROPDOWN */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">
                  Validation Type
                </label>
                <select
                  value={localQuestion.validationType || "none"}
                  onChange={(e) => {
                    const selectedType = e.target.value;
                    handleFieldChange("validationType", selectedType);

                    // Auto-set regex patterns
                    const patterns: Record<string, string> = {
                      email: "example@gmail.com",
                      url: "https://example.com",
                      phone: "Please Enter Valid Phone Number",
                      number: "Please Enter a number",
                      alphanumeric: "Write according to Question",
                    };

                    if (selectedType in patterns) {
                      handleFieldChange(
                        "validationPattern",
                        patterns[selectedType]
                      );
                    } else if (selectedType === "none") {
                      handleFieldChange("validationPattern", "");
                    }
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                >
                  <option value="none">No validation</option>
                  <option value="email">Email address</option>
                  <option value="url">Website URL</option>
                  <option value="phone">Phone number</option>
                  <option value="number">Numbers only</option>
                  <option value="alphanumeric">Letters and numbers only</option>
                  <option value="custom">Custom pattern</option>
                </select>
              </div>

              {/* Editable pattern input - show for any validation type except none */}
              {localQuestion.validationType &&
                localQuestion.validationType !== "none" &&
                localQuestion.validationType !== "" && (
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Validation Pattern
                    </label>
                    <input
                      type="text"
                      placeholder="Enter regex pattern (e.g., ^[0-9]+$)"
                      value={localQuestion.validationPattern || ""}
                      onChange={(e) =>
                        handleFieldChange("validationPattern", e.target.value)
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                    />
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Textarea Settings */}
        {activeQuestion.type === "textarea" && (
          <div className="mb-5">
            <label className="block mb-1.5 text-sm font-medium text-gray-700">
              Text Input Settings
            </label>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Placeholder text"
                value={localQuestion.placeholder || ""}
                onChange={(e) =>
                  handleFieldChange("placeholder", e.target.value)
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Min length"
                  value={localQuestion.minLength || ""}
                  onChange={(e) =>
                    handleFieldChange(
                      "minLength",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  className="w-auto min-w-32 px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                  min="0"
                />
                <input
                  type="number"
                  placeholder="Max length"
                  value={localQuestion.maxLength || ""}
                  onChange={(e) =>
                    handleFieldChange(
                      "maxLength",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  className="w-auto min-w-32 px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                  min="0"
                />
              </div>

              {/* VALIDATION TYPE FOR TEXTAREA */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">
                  Validation Type
                </label>
                <select
                  value={localQuestion.validationType || "none"}
                  onChange={(e) => {
                    const selectedType = e.target.value;
                    handleFieldChange("validationType", selectedType);

                    const patterns: Record<string, string> = {
                      email: "example@gmail.com",
                      url: "",
                      phone: "^[\\+]?[1-9][\\d]{0,15}$",
                      number: "^\\d+$",
                      alphanumeric: "^[a-zA-Z0-9]+$",
                    };

                    if (selectedType in patterns) {
                      handleFieldChange(
                        "validationPattern",
                        patterns[selectedType]
                      );
                    } else if (selectedType === "none") {
                      handleFieldChange("validationPattern", "");
                    }
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                >
                  <option value="none">No validation</option>
                  <option value="email">Email address</option>
                  <option value="url">Website URL</option>
                  <option value="phone">Phone number</option>
                  <option value="number">Numbers only</option>
                  <option value="alphanumeric">Letters and numbers only</option>
                  <option value="custom">Custom pattern</option>
                </select>
              </div>

              {/* Editable pattern input for textarea */}
              {localQuestion.validationType &&
                localQuestion.validationType !== "none" &&
                localQuestion.validationType !== "" && (
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Validation Pattern
                    </label>
                    <input
                      type="text"
                      placeholder="Enter regex pattern (e.g., ^[0-9]+$)"
                      value={localQuestion.validationPattern || ""}
                      onChange={(e) =>
                        handleFieldChange("validationPattern", e.target.value)
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                    />
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Number Settings */}
        {activeQuestion.type === "number" && (
          <div className="mb-5">
            <label className="block mb-1.5 text-sm font-medium text-gray-700">
              Number Settings
            </label>
            <div className="flex gap-3 items-center flex-wrap">
              <input
                type="number"
                placeholder="Min value"
                className="w-auto min-w-32 px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
              />
              <input
                type="number"
                placeholder="Max value"
                className="w-auto min-w-32 px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
              />
              <select className="w-auto min-w-40 px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100">
                <option value="">Any number</option>
                <option value="integer">Whole numbers only</option>
                <option value="decimal">Decimal numbers</option>
              </select>
            </div>
          </div>
        )}

        {/* File Upload Settings */}
        {activeQuestion.type === "file" && (
          <div className="mb-5">
            <label className="block mb-1.5 text-sm font-medium text-gray-700">
              File Upload Settings
            </label>
            <div className="flex gap-3 items-center flex-wrap">
              <input
                type="text"
                placeholder="Allowed file types (e.g., .pdf,.doc,.jpg)"
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
              />
              <input
                type="number"
                placeholder="Max file size (MB)"
                className="w-auto min-w-32 px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                min="1"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetailEditor;
