/**
 * Commitlint configuration for TekupDK workspace
 * Enforces conventional commit format across all projects
 * 
 * Format: <type>(<scope>): <subject>
 * Example: feat(vault): add semantic search endpoint
 * 
 * @see https://www.conventionalcommits.org/
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],
  
  rules: {
    // Subject must be in imperative mood, no period at end
    'subject-case': [2, 'never', ['upper-case', 'pascal-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    
    // Type must be one of the following
    'type-enum': [
      2,
      'always',
      [
        'feat',      // New feature
        'fix',       // Bug fix
        'docs',      // Documentation only
        'style',     // Code style (formatting, semicolons, etc)
        'refactor',  // Code refactoring
        'perf',      // Performance improvement
        'test',      // Adding or updating tests
        'chore',     // Maintenance (deps, configs, etc)
        'ci',        // CI/CD changes
        'build',     // Build system or external dependencies
        'revert',    // Revert previous commit
      ],
    ],
    
    // Scope is optional but recommended
    'scope-empty': [0],
    'scope-case': [2, 'always', 'kebab-case'],
    
    // Body and footer are optional
    'body-leading-blank': [1, 'always'],
    'footer-leading-blank': [1, 'always'],
    
    // Header (type + scope + subject) max 72 chars
    'header-max-length': [2, 'always', 72],
    
    // Subject should be meaningful (min 10 chars)
    'subject-min-length': [2, 'always', 10],
  },
  
  // Project-specific scope suggestions
  prompt: {
    scopes: [
      // Production services
      'vault',
      'billy',
      'database',
      
      // Web apps
      'rendetalje',
      'renos',
      'cloud-dashboard',
      'chat',
      'time-tracker',
      
      // Backend services
      'ai',
      'gmail',
      'mcp',
      
      // Infrastructure
      'ci',
      'docker',
      'docs',
      'config',
      'deps',
      
      // Shared
      'shared',
      'packages',
      'scripts',
      'chatmode',
    ],
  },
};
