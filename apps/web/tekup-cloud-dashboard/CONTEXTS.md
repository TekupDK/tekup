Context Architecture (React)

Overview

- Goal: Comply with React Fast Refresh rule — files should only export components to keep hot reloading stable.
- Change: Split context definitions into three focused files per context.

Pattern

- `<name>Context` (lower camel): exports the Context object and types only.
- `use<Name>`: exports the hook that reads the context.
- `<Name>Provider`: exports the component that provides the context.

Files

- App context
  - `src/contexts/appContext.ts` — Context + types
  - `src/contexts/useApp.ts` — Hook
  - `src/contexts/AppProvider.tsx` — Provider component
  - Backward-compat: `src/contexts/AppContext.tsx` re-exports `AppProvider` only.

- Theme context
  - `src/contexts/themeContext.ts` — Context + types
  - `src/contexts/useTheme.ts` — Hook
  - `src/contexts/ThemeProvider.tsx` — Provider component
  - Backward-compat: `src/contexts/ThemeContext.tsx` re-exports `ThemeProvider` only.

Why

- Fixes eslint rule `react-refresh/only-export-components` without disabling it.
- Improves discoverability and testability of contexts and hooks.

Usage

- Import providers in app root:
  - `import { ThemeProvider } from './contexts/ThemeProvider'`
  - `import { AppProvider } from './contexts/AppProvider'`
- Import hooks in components:
  - `import { useTheme } from '../contexts/useTheme'`
  - `import { useApp } from '../contexts/useApp'`

