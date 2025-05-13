import React from 'react';
import { FormField } from './components/form-field';
import { FormExample } from './components/form-example';

// Componentes
export { FormField };
export { FormExample };

// Hooks
export { useForm } from './hooks/use-form';

// Types
export type {
  FormProps,
  FormFieldProps,
  FormState,
  UseFormReturn
} from './types/form';

// Componente Form principal
import { FormProps } from './types/form';
import { useForm } from './hooks/use-form';

export function Form({ onSubmit, children, className }: FormProps) {
  const form = useForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.isSubmitting) return;

    try {
      await onSubmit(form.values);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  );
}

// Re-export UI form components
export {
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from '@/shared/components/ui/form';
