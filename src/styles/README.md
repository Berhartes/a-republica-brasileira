# Styles Directory - DEPRECATED

## Important Notice

This directory is now deprecated as part of the Tailwind CSS refactoring project.

## Current Status

All styling in the project has been migrated to use Tailwind CSS utility classes. The files in this directory are kept for backward compatibility but are no longer actively maintained.

## Where to Find Styles

1. **Tailwind Configuration**: `config/tailwind.config.ts`
2. **Tailwind Directives**: `src/shared/styles/index.css`
3. **Component Styles**: Each component now contains its styling via Tailwind utility classes

## Backup Files

During the refactoring process, backup files were created with the `.backup` extension. These can be used for reference but should not be used in production.

## Migration Guide

If you need to add new styling to the project:

1. Use Tailwind utility classes directly in your components
2. For reusable components, use the `@layer components` directive in `src/shared/styles/index.css`
3. For theme customization, modify the `tailwind.config.ts` file

## Questions

If you have questions about the refactoring, refer to `REFATORACAO-TAILWIND.md` in the project root or contact the project maintainer.