import { useState } from 'react';
import type { FormState, UseFormReturn } from '../../types/form';

export function useForm(initialValues: Record<string, any> = {}): UseFormReturn {
  const [state, setState] = useState<FormState>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false
  });

  const handleChange = (name: string, value: any) => {
    setState(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [name]: value
      }
    }));
  };

  const handleBlur = (name: string) => {
    setState(prev => ({
      ...prev,
      touched: {
        ...prev.touched,
        [name]: true
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isSubmitting: true }));
    
    // Aqui você pode adicionar validação
    
    setState(prev => ({ ...prev, isSubmitting: false }));
  };

  const reset = () => {
    setState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false
    });
  };

  return {
    ...state,
    handleSubmit,
    handleChange,
    handleBlur,
    reset
  };
}
