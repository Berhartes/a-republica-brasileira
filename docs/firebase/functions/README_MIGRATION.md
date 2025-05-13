# ETL System Migration Guide

## Directory Structure Reorganization

This document describes the migration of the ETL system from the original structure to a more organized, maintainable structure that aligns with modern architectural patterns.

## New Directory Structure

```
functions2/
├── src/
│   ├── config/                # Configurations
│   │
│   ├── core/                  # Core abstractions and utilities
│   │   ├── errors/            # Error handling
│   │   ├── logging/           # Logging functionality
│   │   ├── interfaces/        # Type definitions and interfaces
│   │   └── utils/             # Core utilities
│   │
│   ├── domains/               # Business domain models
│   │   └── congresso/
│   │       └── senado/
│   │           ├── api/       # Domain-specific API methods
│   │           ├── entities/  # Entity definitions
│   │           └── models/    # Data models/interfaces
│   │
│   ├── infrastructure/        # Infrastructure concerns
│   │   ├── api/               # API clients
│   │   ├── database/          # Database access
│   │   └── storage/           # Storage access
│   │
│   ├── etl/                   # All ETL components
│   │   ├── extractors/        # Data extraction
│   │   ├── transformers/      # Data transformation
│   │   ├── loaders/           # Data loading
│   │   └── processors/        # Complete ETL processors
│   │
│   ├── functions/             # Cloud Functions entry points
│   │
│   └── index.ts               # Main entry point
```

## Migration Changes

### File Relocations

1. Core utilities moved to proper locations:
   - `utils/logger.ts` → `core/logging/logger.ts`
   - `utils/errors.ts` → `core/errors/app-error.ts`
   - `utils/auth.ts` → `core/utils/auth.ts`
   - `utils/changes.ts` → `core/utils/changes.ts`
   - `utils/api.ts` → `infrastructure/api/base/api-client.ts`
   - `utils/batch-manager.ts` → `infrastructure/database/batch-manager.ts`

2. Interface definitions consolidated:
   - `core/extractor.ts` → `core/interfaces/extractor.ts`
   - `core/transformer.ts` → `core/interfaces/transformer.ts`
   - `core/loader.ts` → `core/interfaces/loader.ts`
   - `core/processor.ts` → `core/interfaces/processor.ts`

3. ETL components organized by responsibility:
   - `extractors/*.ts` → `etl/extractors/*.ts`
   - `transformers/*.ts` → `etl/transformers/*.ts`
   - `loaders/*.ts` → `etl/loaders/*.ts`
   - `processors/*.ts` → `etl/processors/*.ts`

4. Domain entities moved to domain-specific directories:
   - `domain/entities/*` → `domains/congresso/senado/entities/*`

### Import Path Updates

All import paths have been updated to reflect the new directory structure, removing `.js` extensions to ensure TypeScript compatibility.

## Benefits of the New Structure

1. **Clear Separation of Concerns**:
   - Core components separated from implementation details
   - ETL processes grouped by responsibility rather than entity

2. **Improved Maintainability**:
   - Related files are grouped together
   - Dependencies are more explicit and easier to manage

3. **Enhanced Scalability**:
   - New entity types can be added without changing the structure
   - Common functionality is centralized and reusable

4. **Better Testability**:
   - Components are more isolated and have clearer responsibilities
   - Dependencies can be more easily mocked for testing

## Migration Steps for Other Entities

To migrate other entity types (senadores, comissões, etc.) from the `functions` directory to this new structure, follow these steps:

1. Identify and organize files by responsibility:
   - Extract extractors, transformers, loaders, and processors
   - Move them to their respective directories in the `etl` structure

2. Update import paths in all files to reflect the new structure

3. Test each component individually to ensure it works correctly

4. Add Cloud Function definitions in the `functions` directory

## Next Steps

- Add entity-specific domain models in `domains/congresso/senado/models/`
- Implement repository pattern in `domains/congresso/senado/repositories/`
- Add Firestore indexes and security rules
- Implement incremental updates for efficiency
- Add comprehensive error handling and retry logic

## Legacy Directories

The following directories have been renamed with an `_old` suffix and should be removed after ensuring all required files have been migrated:

- `domain_old/`
- `extractors_old/`
- `transformers_old/`
- `loaders_old/`
- `processors_old/`
- `utils_old/`
