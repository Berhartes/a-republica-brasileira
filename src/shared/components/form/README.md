# Form System Documentation

This document provides an overview of the form system in the República Brasileira project.

## Overview

The form system is a TypeScript-based solution for handling forms in React, incorporating:

- React Hook Form for state management
- Zod for schema validation
- Tailwind CSS for styling
- Component-based architecture

## Core Components

### Form Component

The main `Form` component provides a wrapper for React Hook Form with Zod validation:

```tsx
<Form
  schema={mySchema}
  onSubmit={handleSubmit}
  defaultValues={defaultValues}
  mode="onBlur"
>
  {/* Form fields */}
</Form>