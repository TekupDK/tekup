import js from '@eslint/js';
import typescript from 'typescript-eslint';
import jsdoc from 'eslint-plugin-jsdoc';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';

export default [
  // Global ignores
  {
    ignores: [
      '**/dist/**',
      '**/.next/**', 
      '**/out/**',
      '**/build/**',
      '**/node_modules/**',
      '**/.git/**',
      '**/coverage/**',
      '**/.nyc_output/**',
      '**/tmp/**',
      '**/temp/**'
    ]
  },

  // Base JavaScript configuration
  js.configs.recommended,

  // TypeScript configuration
  ...typescript.configs.recommended,
  ...typescript.configs.stylistic,

  // JSDoc configuration
  jsdoc.configs['flat/recommended'],

  // Base configuration for all files
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    plugins: {
      import: importPlugin,
      jsdoc
    },
    rules: {
      // General code quality
      'no-console': 'error', // Enforce proper logging
      'prefer-const': 'error',
      'no-var': 'error', 
      'object-shorthand': 'error',
      'prefer-template': 'error',
      
      // Performance and best practices
      'no-await-in-loop': 'warn',
      'require-atomic-updates': 'error',
      
      // Import rules
      'import/order': ['error', {
        groups: [
          'builtin',
          'external', 
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
      }],
      
      // JSDoc rules (relaxed)
      'jsdoc/require-jsdoc': ['warn', { 
        publicOnly: true, 
        require: { 
          FunctionDeclaration: true, 
          ClassDeclaration: true, 
          MethodDefinition: true 
        } 
      }],
      'jsdoc/require-param': 'warn',
      'jsdoc/require-returns': 'warn',
      'jsdoc/require-description': 'off', // Too strict for development
      'jsdoc/check-alignment': 'error',
      'jsdoc/check-indentation': 'error',
    }
  },

  // TypeScript specific configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescript.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // Remove project reference for now to avoid path issues
        // project: true,
        // tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // Remove rules requiring type information
      // '@typescript-eslint/prefer-nullish-coalescing': 'error',
      // '@typescript-eslint/prefer-optional-chain': 'error',
    }
  },

  // React/JSX configuration
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React rules
      'react/react-in-jsx-scope': 'off', // Next.js doesn't require React import
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      
      // React Hooks rules  
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // Accessibility rules (relaxed for development)
      'jsx-a11y/anchor-is-valid': 'off', // Next.js Link component
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
    }
  },

  // Test files configuration
  {
    files: ['**/*.{test,spec}.{ts,tsx,js,jsx}', '**/tests/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-console': 'off', // Allow console in tests
      '@typescript-eslint/no-explicit-any': 'off',
      'jsdoc/require-jsdoc': 'off', // No need for JSDoc in tests
    }
  },

  // Configuration files
  {
    files: ['*.config.{ts,js,mjs}', '*.setup.{ts,js}', 'vite.config.*', 'jest.config.*'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      'jsdoc/require-jsdoc': 'off',
    }
  },

  // Node.js specific files
  {
    files: ['**/scripts/**/*.{js,ts,mjs}', '**/build/**/*.{js,ts,mjs}'],
    rules: {
      'no-console': 'off', // Scripts often need console output
      'jsdoc/require-jsdoc': 'off',
    }
  }
];
