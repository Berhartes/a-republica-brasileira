// Tipos básicos para o sistema de formulários
export interface FormFieldProps {
  name: string;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export interface FormProps {
  onSubmit: (data: any) => void;
  children: React.ReactNode;
  className?: string;
}

export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
}

export interface UseFormReturn {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  handleChange: (name: string, value: any) => void;
  handleBlur: (name: string) => void;
  reset: () => void;
}
