module.exports = {
  env: { browser: true, es2020: true },
  globals: {
    window: 'readonly',
    document: 'readonly',
    requestAnimationFrame: 'readonly'
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'no-undef': 'off' // Disable no-undef as TypeScript handles this
  },
}
