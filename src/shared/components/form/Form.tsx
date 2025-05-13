/**
 * Base Form Component
 * Provides integration between React Hook Form and Zod schemas
 */

import React from 'react';
import { useForm, FormProvider, DefaultValues, UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define os modos de validação suportados
type FormMode = 'onSubmit' | 'onChange' | 'onBlur';

interface FormProps<TSchema extends z.ZodType> extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  schema: TSchema;
  onSubmit: (data: z.infer<TSchema>) => void | Promise<void>;
  defaultValues?: DefaultValues<z.infer<TSchema>>;
  children: React.ReactNode;
  mode?: FormMode;
  reValidateMode?: FormMode;
}

export function Form<TSchema extends z.ZodType>({
  schema,
  onSubmit,
  children,
  defaultValues,
  mode = 'onSubmit',
  reValidateMode = 'onChange',
  ...props
}: FormProps<TSchema>) {
  const methods = useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
    reValidateMode,
  });

  const handleSubmit = async (data: z.infer<TSchema>) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleSubmit)}
        {...props}
        className={`space-y-4 ${props.className || ''}`}
        noValidate
      >
        {children}
      </form>
    </FormProvider>
  );
}

// Re-export useful hooks from react-hook-form
export { useFormContext, useWatch, useFieldArray, useController } from 'react-hook-form';