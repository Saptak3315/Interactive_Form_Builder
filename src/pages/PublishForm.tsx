// src/pages/PublishForm.tsx
import PublishFormContainer from "../components/PublishForm/PublishFormContainer";
import { FormProvider } from "../context/FormContext/FormProvider";

const PublishForm = () => {
  return (
    <FormProvider>
      <PublishFormContainer />
    </FormProvider>
  );
}

export default PublishForm;