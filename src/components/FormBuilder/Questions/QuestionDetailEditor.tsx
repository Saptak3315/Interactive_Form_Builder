// src/components/FormBuilder/Questions/QuestionDetailEditor.tsx

import React, { useState, useEffect } from "react";
import "./QuestionDetailEditor.css";
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
      <div className="question-detail-editor">
        <div className="no-question-selected">
          <div className="no-question-icon">📝</div>
          <h3>No question selected</h3>
          <p>Select a question from the editor to start configuring it</p>
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
    <div className="question-detail-editor">
      <div className="editor-header">
        <h3>Question Details</h3>
        <div className="editor-actions">
          <button
            className="save-btn"
            onClick={saveChanges}
            disabled={
              JSON.stringify(localQuestion) === JSON.stringify(activeQuestion)
            }
          >
            💾 Save Changes
          </button>
        </div>
      </div>

      <div className="editor-content">
        {/* Question Type */}
        <div className="form-field">
          <label htmlFor="question-type">Question Type</label>
          <select
            id="question-type"
            value={localQuestion.type || ""}
            onChange={(e) => handleFieldChange("type", e.target.value)}
            className="form-select"
          >
            {questionTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {/* Question Content */}
        <div className="form-field">
          <label htmlFor="question-content">Question Text</label>
          <textarea
            id="question-content"
            value={localQuestion.content || ""}
            onChange={(e) => handleFieldChange("content", e.target.value)}
            placeholder="Enter your question..."
            className="form-textarea"
            rows={3}
          />
        </div>
        {/* Question Explanation */}
        {/* <div className="label">
          <label htmlFor="Label">Write Your Label</label>
          <textarea
          id="question-label"
          value={localQuestion.label||""}
          onChange={(e)=>handleFieldChange("label",e.target.value)}
          //onChange={(e) => handleFieldChange("content", e.target.value)}
            placeholder="Enter your question..."
            className="form-textarea"
            rows={3}
          />
        </div> */}
        <div className="form-field">
          <label htmlFor="question-explanation">Help Text / Explanation</label>
          <textarea
            id="question-explanation"
            value={localQuestion.explanation || ""}
            onChange={(e) => handleFieldChange("explanation", e.target.value)}
            placeholder="Optional help text for respondents..."
            className="form-textarea"
            rows={2}
          />
        </div>
        {/* Required checkbox */}
        <div className="form-field">
          <div className="checkbox-field">
            <input
              type="checkbox"
              id="question-required"
              checked={localQuestion.isRequired || false}
              onChange={(e) =>
                handleFieldChange("isRequired", e.target.checked)
              }
            />
            <label htmlFor="question-required">Required question</label>
          </div>
        </div>
        {/* Points field */}
        <div className="form-field">
          <label htmlFor="question-points">Points (for scoring)</label>
          <input
            type="number"
            id="question-points"
            value={localQuestion.points || ""}
            onChange={(e) =>
              handleFieldChange("points", parseInt(e.target.value) || undefined)
            }
            placeholder="0"
            className="form-input"
            min="-100"
          />
        </div>
        {/* Media URL field */}
        <div className="form-field">
          <label htmlFor="question-media">Media URL</label>
          <input
            type="url"
            id="question-media"
            value={localQuestion.mediaUrl || ""}
            onChange={(e) => handleFieldChange("mediaUrl", e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="form-input"
          />
          {localQuestion.mediaUrl && (
            <div className="media-preview">
              <small>Media type will be auto-detected</small>
            </div>
          )}
        </div>
        {/* Options for choice-based questions */}
        {hasOptions && (
          <div className="form-field">
            <div className="options-header">
              <label>Answer Options</label>
              <button className="add-option-btn" onClick={handleAddOption}>
                + Add Option
              </button>
            </div>

            <div className="options-list">
              {activeQuestion.options?.map((option, index) => (
                <div key={option.id} className="option-item">
                  <div className="option-header">
                    <span className="option-number">{index + 1}</span>
                    <button
                      className="delete-option-btn"
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
                    className="option-input"
                  />

                  <div className="option-controls">
                    <div className="checkbox-field">
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
                      />
                      <label htmlFor={`option-correct-${option.id}`}>
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
                      className="points-input"
                      min="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Question settings specific to type */}

        {activeQuestion.type === "text" && (
          <div className="form-field">
            <label>Text Input Settings</label>
            <div className="text-settings">
              <input
                type="textarea"
                placeholder="Placeholder text"
                value={localQuestion.placeholder || ""}
                onChange={(e) =>
                  handleFieldChange("placeholder", e.target.value)
                }
                className="form-input"
              />
              <div className="input-group">
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
                  className="form-input small"
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
                  className="form-input small"
                  min="0"
                />
              </div>
              <input
                type="text"
                placeholder="Validation pattern (regex)"
                value={localQuestion.validationPattern || ""}
                onChange={(e) =>
                  handleFieldChange("validationPattern", e.target.value)
                }
                className="form-input"
              />
            </div>
          </div>
        )}

         {activeQuestion.type === "textarea" && (
          <div className="form-field">
            <label>Text Input Settings</label>
            <div className="text-settings">
              <input
                type="text"
                placeholder="Placeholder text"
                value={localQuestion.placeholder || ""}
                onChange={(e) =>
                  handleFieldChange("placeholder", e.target.value)
                }
                className="form-input"
              />
              <div className="input-group">
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
                  className="form-input small"
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
                  className="form-input small"
                  min="0"
                />
              </div>
              <input
                type="text"
                placeholder="Validation pattern (regex)"
                value={localQuestion.validationPattern || ""}
                onChange={(e) =>
                  handleFieldChange("validationPattern", e.target.value)
                }
                className="form-input"
              />
            </div>
          </div>
        )}
        {activeQuestion.type === "number" && (
          <div className="form-field">
            <label>Number Settings</label>
            <div className="number-settings">
              <input
                type="number"
                placeholder="Min value"
                className="form-input small"
              />
              <input
                type="number"
                placeholder="Max value"
                className="form-input small"
              />
              <select className="form-select small">
                <option value="">Any number</option>
                <option value="integer">Whole numbers only</option>
                <option value="decimal">Decimal numbers</option>
              </select>
            </div>
          </div>
        )}

        {activeQuestion.type === "file" && (
          <div className="form-field">
            <label>File Upload Settings</label>
            <div className="file-settings">
              <input
                type="text"
                placeholder="Allowed file types (e.g., .pdf,.doc,.jpg)"
                className="form-input"
              />
              <input
                type="number"
                placeholder="Max file size (MB)"
                className="form-input small"
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