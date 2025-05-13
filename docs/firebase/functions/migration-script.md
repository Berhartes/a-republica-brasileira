# Migration Script for ETL Components

This script outlines the steps to migrate ETL components from the old structure in the `functions` directory to the new structure in the `functions2` directory.

## Prerequisites

1. Ensure you have the correct directory structure in the `functions2` directory (as described in `README_MIGRATION.md`).
2. Ensure you have identified all entity types to be migrated.

## Migration Steps for Each Entity Type

For each entity type (senadores, comissões, votações, materias, etc.), follow these steps:

### 1. Identify Source Files

Locate the following files in the `functions` directory:
- `scripts/etl-{entity}-fase1.cjs` - Extractor
- `scripts/etl-{entity}-fase2.cjs` - Transformer
- `scripts/etl-{entity}-fase3.cjs` - Loader
- `scripts/etl-{entity}-completo.cjs` - Processor (if it exists)
- `scripts/visualizar-{entity}.cjs` - Auxiliary files

### 2. Extract Component Logic and Convert to TypeScript

For each component:

1. Create TypeScript files with the following naming convention:
   - `functions2/src/etl/extractors/{entity}-extractor.ts`
   - `functions2/src/etl/transformers/{entity}-transformer.ts`
   - `functions2/src/etl/loaders/{entity}-loader.ts`
   - `functions2/src/etl/processors/{entity}-processor.ts`

2. Convert the CommonJS code to TypeScript, implementing the appropriate interfaces:
   - Extractors should implement the `Extractor` interface from `core/interfaces/extractor.ts`
   - Transformers should implement the `Transformer` interface from `core/interfaces/transformer.ts`
   - Loaders should implement the `Loader` interface from `core/interfaces/loader.ts`
   - Processors should implement the `Processor` interface from `core/interfaces/processor.ts`

3. Update import paths to use the new structure.

### 3. Create Domain Models

1. Define entity interfaces in `functions2/src/domains/congresso/senado/models/{entity}.ts`
2. Create entity classes in `functions2/src/domains/congresso/senado/entities/{entity}.ts`

### 4. Create Cloud Functions

1. Create function definitions in `functions2/src/functions/{entity}-functions.ts`
2. Export the functions in `functions2/src/index.ts`

### 5. Update Test Files

1. Create test files for each component in `functions2/tests/etl/`
2. Update test imports to use the new structure

## Example Migration for Senadores Entity

### Source Files
- `functions/scripts/etl-senado-fase1.cjs`
- `functions/scripts/etl-senado-fase2.cjs`
- `functions/scripts/etl-senado-fase3.cjs`
- `functions/scripts/etl-senado-completo.cjs`
- `functions/scripts/visualizar-senadores.cjs`

### Target Files
- `functions2/src/etl/extractors/senador-extractor.ts`
- `functions2/src/etl/transformers/senador-transformer.ts`
- `functions2/src/etl/loaders/senador-loader.ts`
- `functions2/src/etl/processors/senador-processor.ts`
- `functions2/src/domains/congresso/senado/models/senador.ts`
- `functions2/src/domains/congresso/senado/entities/senador.ts`
- `functions2/src/functions/senador-functions.ts`

### Migration Script Example for senador-extractor.ts

1. Create the file `functions2/src/etl/extractors/senador-extractor.ts`

```typescript
/**
 * Extrator de dados de Senadores do Senado Federal
 */
import { getLogger } from "../../core/logging/logger";
import { AppError, ErrorCode } from "../../core/errors/app-error";
import { senadoApiClient } from "../../domains/congresso/senado/api/senado-api-client";
import { Extractor } from "../../core/interfaces/extractor";

const logger = getLogger("senador-extractor");

/**
 * Interface para parâmetros de extração
 */
export interface SenadorExtractorParams {
  legislatura?: number;
  forceUpdate?: boolean;
}

/**
 * Interface para resultado da extração
 */
export interface SenadorExtractionResult {
  timestamp: string;
  senadores: any[];
  metadados: any;
}

/**
 * Extrator de dados de Senadores
 */
export class SenadorExtractor implements Extractor<SenadorExtractionResult, SenadorExtractorParams> {
  /**
   * Extrai a lista de senadores em exercício
   */
  async extract(params?: SenadorExtractorParams): Promise<SenadorExtractionResult> {
    try {
      logger.info('Extraindo lista de senadores em exercício');
      
      // (Convert logic from etl-senado-fase1.cjs)
      
      // Example:
      const response = await senadoApiClient.get('/senadores/lista/atual');
      
      return {
        timestamp: new Date().toISOString(),
        senadores: response.ListaParlamentarEmExercicio.Parlamentares.Parlamentar || [],
        metadados: response.ListaParlamentarEmExercicio.Metadados || {}
      };
    } catch (error) {
      // Handle errors appropriately
      logger.error(`Erro ao extrair lista de senadores: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      
      throw new AppError(`Erro ao extrair lista de senadores: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, {
        code: ErrorCode.ETL_EXTRACT,
        cause: error instanceof Error ? error : undefined
      });
    }
  }
}

/**
 * Instância singleton do extrator
 */
export const senadorExtractor = new SenadorExtractor();
```

## Migration Validation

After migrating each entity, verify:

1. All components implement the correct interfaces
2. All import paths are correct
3. The code compiles without errors
4. Tests pass

## Cleanup

After successful migration:

1. Remove the `_old` suffixed directories
2. Update documentation
3. Run full system tests

## Further Actions

1. Create indexes for Firestore collections
2. Update security rules
3. Implement CI/CD for automatic testing and deployment
