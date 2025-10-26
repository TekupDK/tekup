module.exports = {
  // Basic formatting
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
  trailingComma: 'es5',
  printWidth: 80,
  
  // Tailwind CSS specific
  plugins: [
    'prettier-plugin-tailwindcss', // Automatically sorts Tailwind classes
  ],
  
  // Tailwind CSS class sorting configuration
  tailwindConfig: './tailwind.config.ts',
  tailwindFunctions: ['clsx', 'cn', 'cva'],
  
  // File-specific overrides
  overrides: [
    {
      files: '*.css',
      options: {
        parser: 'css',
        printWidth: 120, // Longer lines for CSS
      },
    },
    {
      files: '*.scss',
      options: {
        parser: 'scss',
        printWidth: 120,
      },
    },
    {
      files: '*.html',
      options: {
        parser: 'html',
        htmlWhitespaceSensitivity: 'ignore',
        printWidth: 120, // Longer lines for HTML with many classes
      },
    },
    {
      files: '*.json',
      options: {
        parser: 'json',
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        parser: 'markdown',
        proseWrap: 'preserve',
        printWidth: 100,
      },
    },
  ],
};