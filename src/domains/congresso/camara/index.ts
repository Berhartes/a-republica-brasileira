// src/domains/congresso/camara/index.ts
// Components
export * from './components';

// Hooks
export * from './hooks';

// Services
export * from './services';

// Types
import * as camaraTypes from './types';
export { camaraTypes };

// Schemas (reexportação seletiva para evitar conflitos)
import * as camaraSchemas from './schemas';
export { camaraSchemas };