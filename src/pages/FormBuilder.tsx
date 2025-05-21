// src/pages/FormBuilder.tsx
import FormBuilderContainer from "../components/FormBuilder/Core/FormBuilderContainer";
import { FormProvider } from "../context/FormContext/FormProvider";

const FormBuilder = () => {
  return (
    <FormProvider>
      <FormBuilderContainer />
    </FormProvider>
  );
}

export default FormBuilder;