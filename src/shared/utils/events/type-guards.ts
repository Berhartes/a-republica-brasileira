// src/shared/utils/events/type-guards.ts

/**
 * Type guard para verificar se um elemento é um input HTML
 * @param element Elemento a ser verificado
 * @returns true se o elemento for um input
 */
export function isInputElement(element: Element): element is HTMLInputElement {
  return element.tagName === 'INPUT';
}

/**
 * Type guard para verificar se um elemento é um select HTML
 * @param element Elemento a ser verificado
 * @returns true se o elemento for um select
 */
export function isSelectElement(element: Element): element is HTMLSelectElement {
  return element.tagName === 'SELECT';
}

/**
 * Type guard para verificar se um elemento é um textarea HTML
 * @param element Elemento a ser verificado
 * @returns true se o elemento for um textarea
 */
export function isTextAreaElement(element: Element): element is HTMLTextAreaElement {
  return element.tagName === 'TEXTAREA';
}

/**
 * Type guard para verificar se um elemento é um button HTML
 * @param element Elemento a ser verificado
 * @returns true se o elemento for um button
 */
export function isButtonElement(element: Element): element is HTMLButtonElement {
  return element.tagName === 'BUTTON';
}

/**
 * Type guard para verificar se um elemento é um input de arquivo
 * @param element Elemento a ser verificado
 * @returns true se o elemento for um input de arquivo
 */
export function isFileInput(element: Element): element is HTMLInputElement {
  return isInputElement(element) && element.type === 'file';
}

/**
 * Type guard para verificar se um elemento é um input de checkbox
 * @param element Elemento a ser verificado
 * @returns true se o elemento for um input de checkbox
 */
export function isCheckboxInput(element: Element): element is HTMLInputElement {
  return isInputElement(element) && element.type === 'checkbox';
}

/**
 * Type guard para verificar se um elemento é um input de radio
 * @param element Elemento a ser verificado
 * @returns true se o elemento for um input de radio
 */
export function isRadioInput(element: Element): element is HTMLInputElement {
  return isInputElement(element) && element.type === 'radio';
}

/**
 * Type guard para verificar se um elemento é um input de number
 * @param element Elemento a ser verificado
 * @returns true se o elemento for um input de number
 */
export function isNumberInput(element: Element): element is HTMLInputElement {
  return isInputElement(element) && element.type === 'number';
}

/**
 * Type guard para verificar se um evento de teclado é tecla Enter
 * @param event Evento de teclado a ser verificado
 * @returns true se a tecla for Enter
 */
export function isEnterKey(event: React.KeyboardEvent): boolean {
  return event.key === 'Enter';
}

/**
 * Type guard para verificar se um evento de teclado é tecla Escape
 * @param event Evento de teclado a ser verificado
 * @returns true se a tecla for Escape
 */
export function isEscapeKey(event: React.KeyboardEvent): boolean {
  return event.key === 'Escape';
}

export default {
  isInputElement,
  isSelectElement,
  isTextAreaElement,
  isButtonElement,
  isFileInput,
  isCheckboxInput,
  isRadioInput,
  isNumberInput,
  isEnterKey,
  isEscapeKey
};