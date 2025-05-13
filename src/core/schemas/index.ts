/**
 * @file Arquivo central de exportação de schemas do core
 * @description Centraliza a exportação de todos os schemas do core
 */

// Schemas de dados e validação
export * from './senado';

// Reexportações individuais para evitar conflitos
import * as formsSchemas from './forms';
export { formsSchemas };

// Reexportações individuais para evitar conflitos
import * as commonSchemas from './common';
export { commonSchemas };

// Esquemas de API
export * from './api';