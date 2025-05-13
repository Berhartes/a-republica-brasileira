// src/shared/utils/events/event-handlers.ts
import { z } from 'zod';
import { logger } from '@/core/monitoring';
import { isFileInput, isInputElement, isSelectElement } from '@/shared/utils/events/type-guards';

/**
 * Tipo para manipuladores de eventos com tipagem segura
 */
export type TypedEventHandler<T> = (value: T) => void;

/**
 * Type-safe event handler para mudanças de input
 * Resolve problemas de tipagem para eventos de input
 * 
 * @param setter Função para definir o valor
 * @param transformer Função opcional para transformar o valor
 * @returns Manipulador de evento tipado
 */
export function createTypedChangeHandler<T>(
  setter: TypedEventHandler<T>,
  transformer: (value: string) => T = value => value as unknown as T
) {
  return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    try {
      if (isInputElement(event.target) || isSelectElement(event.target)) {
        setter(transformer(event.target.value));
      }
    } catch (error) {
      logger.error('Erro no manipulador de mudança:', error);
    }
  };
}

/**
 * Type-safe event handler para inputs de arquivo
 * Resolve problemas de tipagem para eventos de upload de arquivo
 * 
 * @param handler Função para processar arquivos
 * @param onError Função opcional para tratar erros
 * @returns Manipulador de evento tipado
 */
export function createTypedFileHandler(
  handler: (files: FileList) => void,
  onError?: (error: Error) => void
) {
  return (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!isFileInput(event.target)) {
        throw new Error('Elemento de input de arquivo inválido');
      }
      
      if (!event.target.files) {
        throw new Error('Nenhum arquivo selecionado');
      }
      
      handler(event.target.files);
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error);
      } else {
        logger.error('Erro no manipulador de arquivo:', error);
      }
    }
  };
}

/**
 * Type-safe click event handler
 * Resolve problemas de tipagem para eventos de clique
 * 
 * @param handler Função para processar o clique
 * @returns Manipulador de evento tipado
 */
export function createTypedClickHandler<T extends HTMLElement>(
  handler: (element: T) => void
) {
  return (event: React.MouseEvent<T>) => {
    try {
      event.preventDefault();
      handler(event.currentTarget);
    } catch (error) {
      logger.error('Erro no manipulador de clique:', error);
    }
  };
}

/**
 * Schema para validar dados de formulário
 */
export const formDataSchema = z.record(z.string(), z.unknown());

/**
 * Type-safe form submit handler
 * Resolve problemas comuns de tipagem para submissão de formulários
 * 
 * @param handler Função para processar dados do formulário
 * @param validator Função opcional para validar dados
 * @returns Manipulador de evento tipado
 */
export function createTypedSubmitHandler<T extends Record<string, unknown>>(
  handler: (data: T) => void | Promise<void>,
  validator?: (data: unknown) => data is T
) {
  return async (event: React.FormEvent<HTMLFormElement>) => {
    try {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const data = Object.fromEntries(formData.entries());
      
      if (validator && !validator(data)) {
        throw new Error('Dados de formulário inválidos');
      }
      
      await handler(data as T);
    } catch (error) {
      logger.error('Erro no manipulador de submissão:', error);
    }
  };
}

/**
 * Type-safe keyboard event handler
 * Manipula eventos de teclado com tipagem adequada
 * 
 * @param handler Função para processar a tecla
 * @param allowedKeys Lista opcional de teclas permitidas
 * @returns Manipulador de evento tipado
 */
export function createTypedKeyHandler(
  handler: (key: string) => void,
  allowedKeys?: string[]
) {
  return (event: React.KeyboardEvent<HTMLElement>) => {
    try {
      if (!allowedKeys || allowedKeys.includes(event.key)) {
        handler(event.key);
      }
    } catch (error) {
      logger.error('Erro no manipulador de teclado:', error);
    }
  };
}

/**
 * Type-safe drag and drop handler
 * Manipula eventos de arrastar e soltar com tipagem adequada
 * 
 * @param handler Função para processar arquivos
 * @param onError Função opcional para tratar erros
 * @returns Manipulador de evento tipado
 */
export function createTypedDropHandler(
  handler: (files: File[]) => void,
  onError?: (error: Error) => void
) {
  return (event: React.DragEvent<HTMLElement>) => {
    try {
      event.preventDefault();
      
      const files = Array.from(event.dataTransfer.files);
      if (files.length === 0) {
        throw new Error('Nenhum arquivo solto');
      }
      
      handler(files);
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error);
      } else {
        logger.error('Erro no manipulador de arrastar e soltar:', error);
      }
    }
  };
}

/**
 * Type-safe focus/blur event handler
 * Manipula eventos de foco com tipagem adequada
 * 
 * @param onFocus Função opcional para processar foco
 * @param onBlur Função opcional para processar desfoque
 * @returns Objeto com manipuladores de eventos tipados
 */
export function createTypedFocusHandler<T extends HTMLElement>(
  onFocus?: (element: T) => void,
  onBlur?: (element: T) => void
) {
  return {
    onFocus: (event: React.FocusEvent<T>) => {
      try {
        if (onFocus) {
          onFocus(event.currentTarget);
        }
      } catch (error) {
        logger.error('Erro no manipulador de foco:', error);
      }
    },
    onBlur: (event: React.FocusEvent<T>) => {
      try {
        if (onBlur) {
          onBlur(event.currentTarget);
        }
      } catch (error) {
        logger.error('Erro no manipulador de desfoque:', error);
      }
    }
  };
}

export default {
  createTypedChangeHandler,
  createTypedFileHandler,
  createTypedClickHandler,
  createTypedSubmitHandler,
  createTypedKeyHandler,
  createTypedDropHandler,
  createTypedFocusHandler
};