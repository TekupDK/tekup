# Tekup Website Prototype

A lightweight Next.js App Router prototype for the Tekup marketing site. Includes a high-conversion hero, product modules, and a minimal Tailwind theme with glassmorphism utilities.

## Run locally (inside monorepo)

Windows PowerShell:

```
pnpm --filter tekup-website-prototype install
pnpm --filter tekup-website-prototype dev
```

The app runs on http://localhost:3030

## Notes
- Uses Tailwind CSS (v4 syntax) via `@import "tailwindcss";` and CSS variables for P3 palette.
- Minimal UI components in `components/ui` (Button, Badge).
- No external icon library; inline SVGs only.
