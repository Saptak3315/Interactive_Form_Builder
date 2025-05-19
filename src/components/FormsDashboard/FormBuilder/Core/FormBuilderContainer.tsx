import { useFormContext } from "../../../../context/FormContext/FormProvider";
import FormHeader from "./FormHeader";
import FormToolbar from "./FormToolbar";
import QuestionEditor from "./QuestionEditor";
import FormPreview from "./FormPreview";
import "./FormBuilderContainer.css";

const FormBuilderContainer = () => {
  const { state } = useFormContext();

  return (
    <div className="form-builder-container">
      {/* Header with form title and description */}
      <FormHeader />
      
      {/* Toolbar with actions */}
      <FormToolbar />
      
      {/* Main content area with two panels */}
      <div className="form-builder-content">
        {/* Left panel - Editor */}
        <div className="form-builder-editor">
          <div className="editor-header">
            <h3>Edit Form</h3>
            <span className="question-count">
              {state.questions.length} {state.questions.length === 1 ? 'Question' : 'Questions'}
            </span>
          </div>
          <div className="editor-content">
            <QuestionEditor />
          </div>
        </div>
        
        {/* Right panel - Preview */}
        <div className="form-builder-preview">
          <div className="preview-header">
            <h3>Preview</h3>
            <div className="preview-controls">
              <button className="preview-device-btn active" data-device="desktop">
                🖥️
              </button>
              <button className="preview-device-btn" data-device="tablet">
                📱
              </button>
              <button className="preview-device-btn" data-device="mobile">
                📱
              </button>
            </div>
          </div>
          <div className="preview-content">
            <FormPreview />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FormBuilderContainer