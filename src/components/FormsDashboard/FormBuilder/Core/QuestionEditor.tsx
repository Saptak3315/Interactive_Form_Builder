import { useFormContext } from '../../../../context/FormContext/FormProvider';

const QuestionEditor = () => {
  const { state } = useFormContext();

  if (state.questions.length === 0) {
    return (
      <div className="question-editor-placeholder">
        <div className="placeholder-content">
          <h3>No questions yet</h3>
          <p>Add your first question using the toolbar on the left</p>
        </div>
      </div>
    );
  }

  return (
    <div className="question-editor">
      <p>Question editor will be implemented in Phase 2</p>
      <p>Current questions: {state.questions.length}</p>
      {state.questions.map((question, index) => (
        <div key={question.id} className="question-item">
          <strong>Question {index + 1}:</strong> {question.type}
        </div>
      ))}
    </div>
  );
}

export default QuestionEditor