import React from 'react';
import type { FormFieldProps } from '../../types/form';

export function FormField({
  name,
  label,
  error,
  required = false,
  disabled = false,
  children
}: FormFieldProps & { children: React.ReactNode }) {
  return (
    <div className="form-field">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {children}
      
      {error && (
        <span className="text-red-500 text-sm">{error}</span>
      )}
    </div>
  );
}
