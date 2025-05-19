import { useFormContext } from '../../../../context/FormContext/FormProvider';

const FormPreview = () => {
  const { state } = useFormContext();

  return (
    <div className="form-preview">
      <div className="preview-form">
        <div className="preview-form-header">
          <h2>{state.title}</h2>
          {state.description && <p>{state.description}</p>}
        </div>
        
        <div className="preview-questions">
          {state.questions.length === 0 ? (
            <p className="preview-placeholder">No questions to preview</p>
          ) : (
            state.questions.map((question, index) => (
              <div key={question.id} className="preview-question">
                <label>
                  {index + 1}. {question.content || `Question ${index + 1}`}
                  {question.isRequired && <span className="required">*</span>}
                </label>
                <p className="question-type-note">({question.type})</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default FormPreview