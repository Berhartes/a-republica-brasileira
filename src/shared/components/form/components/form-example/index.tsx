import React from 'react';
import { Form } from '../..';
import { FormField } from '../form-field';
import { useForm } from '../../hooks/use-form';

export function FormExample() {
  const handleSubmit = (data: any) => {
    console.log('Form submitted:', data);
  };

  return (
    <Form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        name="name"
        label="Nome"
        required
      >
        <input
          type="text"
          name="name"
          className="form-input"
          required
        />
      </FormField>

      <FormField
        name="email"
        label="Email"
        required
      >
        <input
          type="email"
          name="email"
          className="form-input"
          required
        />
      </FormField>

      <button
        type="submit"
        className="btn btn-primary"
      >
        Enviar
      </button>
    </Form>
  );
}
