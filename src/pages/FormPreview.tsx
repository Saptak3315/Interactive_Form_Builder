// src/pages/FormPreview.tsx
import FullFormPreview from "../components/FormPreview/FullFormPreview";
import { FormProvider } from "../context/FormContext/FormProvider";

const FormPreview = () => {
  return (
    <FormProvider>
      <FullFormPreview />
    </FormProvider>
  );
};

export default FormPreview;