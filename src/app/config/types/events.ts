import { ReactNode } from 'react';

/**
 * Tipos para manipulação de eventos
 */

// Handler básico de eventos
export type BaseEventHandler<E> = (event: E) => void;

// Handlers comuns de eventos
export interface CommonEventHandlers {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  onChange?: (event: React.ChangeEvent<HTMLElement>) => void;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  onKeyPress?: (event: React.KeyboardEvent<HTMLElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLElement>) => void;
}

// Handlers de eventos de formulário
export interface FormEventHandlers {
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

// Handlers de eventos de arquivo
export interface FileEventHandlers {
  onFileChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDrop?: (event: React.DragEvent<HTMLElement>) => void;
}

// Guards de tipo para tratamento de eventos
export function isInputElement(element: EventTarget | null): element is HTMLInputElement {
  return element instanceof HTMLInputElement;
}

export function isFileInput(element: EventTarget | null): element is HTMLInputElement {
  return element instanceof HTMLInputElement && element.type === 'file';
}

export function isSelectElement(element: EventTarget | null): element is HTMLSelectElement {
  return element instanceof HTMLSelectElement;
}

// Wrappers de tratamento de eventos
export function createChangeHandler<T extends HTMLElement>(
  handler: (value: string) => void
): (event: React.ChangeEvent<T>) => void {
  return (event: React.ChangeEvent<T>) => {
    if (isInputElement(event.target) || isSelectElement(event.target)) {
      handler(event.target.value);
    }
  };
}

export function createFileChangeHandler(
  handler: (files: FileList | null) => void
): (event: React.ChangeEvent<HTMLInputElement>) => void {
  return (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isFileInput(event.target)) {
      handler(event.target.files);
    }
  };
}

// Props comuns de componentes com eventos
export interface BaseComponentProps {
  children?: ReactNode;
  className?: string;
}

export interface ClickableComponentProps extends BaseComponentProps {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
}

export interface FormComponentProps extends BaseComponentProps {
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  type?: string;
  placeholder?: string;
  min?: number | string;
  max?: number | string;
  pattern?: string;
  autoComplete?: string;
  rows?: number;
}

// Props e estado de error boundary
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}