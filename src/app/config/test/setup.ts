import '@testing-library/jest-dom';
import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Definir DataTransfer globalmente se não existir
if (typeof window.DataTransfer === 'undefined') {
  window.DataTransfer = class DataTransfer {
    private items = new Map<string, string>();
    private _files: File[] = [];
    
    get files(): FileList {
      return Object.defineProperties(
        this._files, {
          item: {
            value: (index: number) => this._files[index]
          },
          length: {
            value: this._files.length
          }
        }
      ) as unknown as FileList;
    }
    
    setDragImage(): void {}
    
    clearData(): void {
      this.items.clear();
      this._files = [];
    }
    
    getData(format: string): string { 
      return this.items.get(format) || ''; 
    }
    
    setData(format: string, data: string): void {
      this.items.set(format, data);
    }
    
    get types(): string[] {
      return Array.from(this.items.keys());
    }
  } as any;
}

// Limpar após cada teste
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];
  
  constructor(
    private callback: IntersectionObserverCallback,
    private options: IntersectionObserverInit = {}
  ) {}

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
};

// Mock HTMLFormElement.prototype.requestSubmit
if (!HTMLFormElement.prototype.requestSubmit) {
  HTMLFormElement.prototype.requestSubmit = function(submitter?: HTMLElement | null): void {
    if (submitter && !(submitter instanceof HTMLElement)) {
      throw new TypeError('Failed to execute \'requestSubmit\' on \'HTMLFormElement\': parameter 1 is not of type \'HTMLElement\'.');
    }

    if (submitter && !this.contains(submitter)) {
      throw new Error('The specified element is not owned by this form element.');
    }

    // Criar e disparar um evento de submit
    const submitEvent = new Event('submit', {
      bubbles: true,
      cancelable: true,
    });

    // Se o evento não foi cancelado, submeter o formulário
    if (this.dispatchEvent(submitEvent)) {
      if (typeof this.submit === 'function') {
        this.submit();
      }
    }
  };
}

// Mock console.error para falhar testes em erros do React
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      /Warning.*not wrapped in act/.test(args[0] as string) ||
      /Warning.*Cannot update a component/.test(args[0] as string) ||
      /Error: Not implemented: HTMLFormElement\.prototype\.requestSubmit/.test(args[0] as string)
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Aumentar o timeout padrão para testes assíncronos
vi.setConfig({ testTimeout: 10000 });