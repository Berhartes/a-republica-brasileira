/**
 * Tipos para testes
 */

// Estende tipos globais
declare global {
  // Estende Window com mocks
  interface Window {
    DataTransfer: typeof DataTransfer;
    // Adicionamos uma sobrecarga específica para testes que não conflita com a definição nativa
  }

  // Nota: ResizeObserver já é definido no DOM global, não precisamos redefinir

  // Nota: IntersectionObserver já é definido no DOM global, não precisamos redefinir
}

// Tipos para helpers de teste

/**
 * Opções para renderização de teste
 */
export interface RenderOptions {
  wrapper?: React.ComponentType<any>;
  container?: HTMLElement;
  baseElement?: HTMLElement;
  hydrate?: boolean;
}

/**
 * Configuração para fixtures de teste
 */
export interface TestFixture<T = any> {
  setup(): Promise<T> | T;
  teardown?(context: T): Promise<void> | void;
}

/**
 * Opções para criação de mocks
 */
export interface MockOptions {
  name?: string;
  partial?: boolean;
  spy?: boolean;
}

/**
 * Configuração para eventos customizados
 */
export interface CustomEventInit<T = any> extends EventInit {
  detail?: T;
}

/**
 * Opções para consultas de testes
 */
export interface QueryOptions {
  exact?: boolean;
  normalizer?: (text: string) => string;
  selector?: string;
  ignore?: string | boolean;
  trim?: boolean;
  collapseWhitespace?: boolean;
}

/**
 * Opções para eventos de usuário
 */
export interface UserEventOptions {
  skipHover?: boolean;
  skipPointerEventsCheck?: boolean;
  writeValueImmediately?: boolean;
}