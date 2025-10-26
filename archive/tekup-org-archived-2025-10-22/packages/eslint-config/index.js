/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:jsdoc/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'jsdoc',
    'import',
  ],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    
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
    
    // General code quality
    'no-console': 'error', // Enforce proper logging
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    
    // JSDoc rules
    'jsdoc/require-description': 'warn',
    'jsdoc/check-alignment': 'error',
    'jsdoc/check-indentation': 'error',
    
    // Performance and best practices
    'no-await-in-loop': 'warn',
    'require-atomic-updates': 'error',
  },
  overrides: [
    // React/Next.js specific config
    {
      files: ['**/*.tsx', '**/*.jsx'],
      extends: [
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended',
      ],
      plugins: ['react', 'react-hooks', 'jsx-a11y'],
      rules: {
        'react/react-in-jsx-scope': 'off', // Next.js doesn't require React import
        'react/prop-types': 'off', // Using TypeScript for prop validation
        'jsx-a11y/anchor-is-valid': 'off', // Next.js Link component
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
    },
    // Test files
    {
      files: ['**/*.test.{ts,tsx,js,jsx}', '**/*.spec.{ts,tsx,js,jsx}'],
      env: {
        jest: true,
      },
      rules: {
        'no-console': 'off', // Allow console in tests
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    // Config files
    {
      files: ['*.config.{ts,js,mjs}', '*.setup.{ts,js}'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
