// src/utils/validationSchemas.ts
import { z } from 'zod';

// Zod schemas for different validation types
export const validationSchemas = {
  email: z.string().email(), // ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
  url: z.string().url(), // ^https?:\/\/(?:[\w-]+\.)+[a-zA-Z]{2,}(?::\d+)?(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?$
  phone: z.string().regex(/^\+?[1-9]\d{0,14}$/), // No built-in phone validator
  number: z.string().regex(/^\d+$/), // For string inputs that should contain only numbers
  alphanumeric: z.string().regex(/^[a-zA-Z0-9]+$/), // No built-in alphanumeric validator
};

// Validation function for text inputs
export const validateTextInput = (question: any, value: any): { isValid: boolean; error?: string } => {
  try {
    // Handle full_name and address validation separately (arrays)
    if (question.type === 'full_name' || question.type === 'address') {
      if (question.isRequired) {
        const values = Array.isArray(value) ? value : [];
        const hasEmptyRequired = question.options?.some((_option: any, index: number) =>
          !values[index] || !values[index].toString().trim()
        );

        if (hasEmptyRequired) {
          return { isValid: false, error: 'All name fields are required' };
        }
      }
      return { isValid: true };
    }

    // Handle optional fields early
    if (!question.isRequired && (!value || !value.toString().trim())) {
      return { isValid: true };
    }

    const stringValue = value ? value.toString() : '';

    // Build schema based on requirements
    let schema = z.string();

    // Required validation
    if (question.isRequired) {
      schema = schema.min(1, 'This field is required');
    }

    // Length validations
    if (question.minLength) {
      schema = schema.min(question.minLength,
        question.errorMessageForMinLength || `Minimum ${question.minLength} characters required`
      );
    }

    if (question.maxLength) {
      schema = schema.max(question.maxLength,
        question.errorMessageForMaxLength || `Maximum ${question.maxLength} characters allowed`
      );
    }

    // Auto-set validation types for specific question types
    let validationType = question.validationType;
    if (question.type === 'email' && (!validationType || validationType === 'none')) {
      validationType = 'email';
    }
    if (question.type === 'number' && (!validationType || validationType === 'none')) {
      validationType = 'number';
    }

    // Pattern/type validation
    if (validationType && validationType !== 'none') {
      if (validationSchemas[validationType as keyof typeof validationSchemas]) {
        // Use Zod's built-in validation, but we need to handle the error message
        const typeSchema = validationSchemas[validationType as keyof typeof validationSchemas];
        const result = typeSchema.safeParse(stringValue);
        if (!result.success) {
          return {
            isValid: false,
            error: question.errorMessageForPattern || `Invalid ${validationType} format`
          };
        }
      } else if (question.validationPattern) {
        // Custom pattern validation
        try {
          const regex = new RegExp(question.validationPattern);
          if (!regex.test(stringValue)) {
            return {
              isValid: false,
              error: question.errorMessageForPattern || `Invalid ${validationType} format`
            };
          }
        } catch (e) {
          console.error('Invalid regex pattern:', e);
          return { isValid: false, error: 'Invalid validation pattern configured' };
        }
      }
    }

    // Validate with the built schema for length and required requirements
    const result = schema.safeParse(stringValue);
    if (!result.success) {
      return { isValid: false, error: result.error.errors[0].message };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Text input validation error:', error);
    return { isValid: false, error: 'Validation failed' };
  }
};

// Validation function for multiple choice inputs
export const validateMultipleChoice = (question: any, value: any): { isValid: boolean; error?: string } => {
  try {
    if (question.type === 'checkbox') {
      const schema = question.isRequired
        ? z.array(z.any()).min(1, 'Please select at least one option')
        : z.array(z.any()).optional();

      const selectedOptions = Array.isArray(value) ? value : [];
      const result = schema.safeParse(selectedOptions);

      if (!result.success) {
        return { isValid: false, error: result.error.errors[0].message };
      }
    } else if (question.type === 'multiple_choice') {
      const isMultiSelect = question.mcqSettings?.allowMultipleCorrect || false;

      if (isMultiSelect) {
        const selectedOptions = Array.isArray(value) ? value : [];

        // Base schema for array
        let schema = z.array(z.any());

        // Required validation
        if (question.isRequired) {
          schema = schema.min(1, 'Please select at least one option');
        }

        // Min/Max selections validation
        const minSelections = question.mcqSettings?.minSelections;
        const maxSelections = question.mcqSettings?.maxSelections;

        if (minSelections) {
          schema = schema.min(minSelections, `Please select at least ${minSelections} option(s)`);
        }

        if (maxSelections) {
          schema = schema.max(maxSelections, `Please select no more than ${maxSelections} option(s)`);
        }

        const result = schema.safeParse(selectedOptions);
        if (!result.success) {
          return { isValid: false, error: result.error.errors[0].message };
        }
      } else {
        // Single selection validation
        if (question.isRequired) {
          const schema = z.any().refine(val => val !== '' && val !== null && val !== undefined, {
            message: 'Please select an option'
          });

          const result = schema.safeParse(value);
          if (!result.success) {
            return { isValid: false, error: result.error.errors[0].message };
          }
        }
      }
    } else if (question.type === 'full_name' || question.type === 'address') {
      const values = Array.isArray(value) ? value : [];
      const trimmedValues = values.map(val => val ? val.toString().trim() : '');
      const hasAnyContent = trimmedValues.some(val => val.length > 0);

      if (question.isRequired || hasAnyContent) {
        const emptyFields: any[] = [];
        question.options?.forEach((option: any, index: number) => {
          const trimmedValue = values[index] ? values[index].toString().trim() : '';
          if (!trimmedValue) {
            emptyFields.push(option.content);
          }
        });

        if (emptyFields.length > 0) {
          const errorMessage = question.isRequired
            ? `${emptyFields.join(', ')} ${emptyFields.length === 1 ? 'is' : 'are'} required`
            : `Please complete all name fields or leave all empty`;
          return { isValid: false, error: errorMessage };
        }
      }
    } else if (question.type === 'dynamic_text_fields') {
      if (question.isRequired) {
        const values = Array.isArray(value) ? value : [];
        const schema = z.array(z.string()).refine(
          arr => arr.some(val => val && val.toString().trim()),
          { message: 'Please add at least one item' }
        );

        const result = schema.safeParse(values);
        if (!result.success) {
          return { isValid: false, error: result.error.errors[0].message };
        }

        // Check for empty fields in between filled ones
        const emptyFields = values.filter(val => !val || !val.toString().trim());
        if (emptyFields.length > 0 && values.length > 1) {
          return { isValid: false, error: 'Please fill all fields or remove empty ones' };
        }
      }
    }

    return { isValid: true };
  } catch (error) {
    console.error('Multiple choice validation error:', error);
    return { isValid: false, error: 'Validation failed' };
  }
};

// Validation function for file uploads
export const validateFileUpload = (question: any, value: any): { isValid: boolean; error?: string } => {
  try {
    if (question.isRequired && !value) {
      return { isValid: false, error: 'Please upload a file' };
    }
    return { isValid: true };
  } catch (error) {
    console.error('File upload validation error:', error);
    return { isValid: false, error: 'Validation failed' };
  }
};

// General validation function that routes to appropriate validator
export const validateQuestion = (question: any, value: any): { isValid: boolean; error?: string } => {
  switch (question.type) {
    case 'text':
    case 'textarea':
    case 'email':
    case 'phone':
    case 'number':
      return validateTextInput(question, value);

    case 'multiple_choice':
    case 'checkbox':
    case 'full_name':
    case 'address':
    case 'dynamic_text_fields':
      return validateMultipleChoice(question, value);

    case 'file':
    case 'audio':
      return validateFileUpload(question, value);

    default:
      // Default validation for other types
      if (question.isRequired && (!value || value === '')) {
        return { isValid: false, error: 'This field is required' };
      }
      return { isValid: true };
  }
};