/**
 * TekUp NLP - Advanced Natural Language Programming Engine
 * Simulates the AI Translation Layer: Natural Language → AST → Optimized Code
 */

class NLPParser {
  constructor() {
    this.patterns = {
      authentication: [
        'user authentication', 'login', 'signin', 'autentificering', 'log ind',
        'password', 'adgangskode', 'jwt', 'token', 'bcrypt', 'hash'
      ],
      crud: [
        'crud', 'create', 'read', 'update', 'delete', 'opret', 'læs', 'opdater', 'slet',
        'user management', 'brugerstyring', 'database', 'database'
      ],
      api: [
        'api', 'endpoint', 'route', 'validation', 'validering', 'error handling',
        'express', 'middleware', 'request', 'response'
      ],
      security: [
        'security', 'sikkerhed', 'encryption', 'kryptering', 'authentication',
        'authorization', 'autorisering', 'rate limiting', 'cors'
      ]
    };
    
    this.codeTemplates = {
      authentication: this.getAuthTemplate(),
      crud: this.getCRUDTemplate(),
      api: this.getAPITemplate(),
      security: this.getSecurityTemplate()
    };
  }

  /**
   * Main entry point: Natural Language → Executable Code
   */
  async generateCode(naturalLanguage, options = {}) {
    console.log('🤖 Processing:', naturalLanguage);
    
    // Step 1: Natural Language → AST
    const ast = this.parseToAST(naturalLanguage);
    console.log('🌳 Generated AST:', ast);
    
    // Step 2: AST → Optimized Code
    const code = this.generateFromAST(ast, options);
    console.log('⚡ Generated Code:', code);
    
    // Step 3: Code Analysis & Optimization
    const analysis = this.analyzeCode(code);
    const optimizedCode = this.optimizeCode(code, analysis);
    
    return {
      original: naturalLanguage,
      ast: ast,
      code: optimizedCode,
      analysis: analysis,
      dependencies: this.extractDependencies(optimizedCode),
      security: this.securityAnalysis(optimizedCode),
      performance: this.performanceAnalysis(optimizedCode)
    };
  }

  /**
   * Step 1: Parse natural language to Abstract Syntax Tree
   */
  parseToAST(naturalLanguage) {
    const lowerInput = naturalLanguage.toLowerCase();
    const ast = {
      type: 'program',
      intent: this.detectIntent(lowerInput),
      entities: this.extractEntities(lowerInput),
      requirements: this.extractRequirements(lowerInput),
      language: this.detectLanguage(naturalLanguage),
      complexity: this.assessComplexity(lowerInput)
    };
    
    return ast;
  }

  /**
   * Detect the primary intent of the request
   */
  detectIntent(input) {
    for (const [intent, patterns] of Object.entries(this.patterns)) {
      if (patterns.some(pattern => input.includes(pattern))) {
        return intent;
      }
    }
    return 'general';
  }

  /**
   * Extract key entities from the natural language
   */
  extractEntities(input) {
    const entities = [];
    
    // Extract domain entities
    if (input.includes('user') || input.includes('bruger')) entities.push('user');
    if (input.includes('product') || input.includes('produkt')) entities.push('product');
    if (input.includes('order') || input.includes('ordre')) entities.push('order');
    
    // Extract technical entities
    if (input.includes('database') || input.includes('database')) entities.push('database');
    if (input.includes('api') || input.includes('endpoint')) entities.push('api');
    if (input.includes('middleware')) entities.push('middleware');
    
    return entities;
  }

  /**
   * Extract functional requirements
   */
  extractRequirements(input) {
    const requirements = [];
    
    if (input.includes('secure') || input.includes('sikker')) requirements.push('security');
    if (input.includes('fast') || input.includes('hurtig')) requirements.push('performance');
    if (input.includes('test') || input.includes('test')) requirements.push('testing');
    if (input.includes('validate') || input.includes('valider')) requirements.push('validation');
    
    return requirements;
  }

  /**
   * Detect if input is in Danish or English
   */
  detectLanguage(input) {
    const danishWords = ['opret', 'bruger', 'autentificering', 'adgangskode', 'database', 'validering'];
    const hasDanish = danishWords.some(word => input.toLowerCase().includes(word));
    return hasDanish ? 'danish' : 'english';
  }

  /**
   * Assess complexity of the request
   */
  assessComplexity(input) {
    let score = 1;
    if (input.includes('authentication') || input.includes('security')) score += 2;
    if (input.includes('crud') || input.includes('database')) score += 1;
    if (input.includes('api') || input.includes('endpoint')) score += 1;
    if (input.includes('validation') || input.includes('error')) score += 1;
    
    if (score <= 2) return 'simple';
    if (score <= 4) return 'medium';
    return 'complex';
  }

  /**
   * Step 2: Generate code from AST
   */
  generateFromAST(ast, options) {
    const template = this.codeTemplates[ast.intent] || this.getGeneralTemplate();
    
    return this.customizeTemplate(template, ast, options);
  }

  /**
   * Customize template based on AST and options
   */
  customizeTemplate(template, ast, options) {
    let code = template;
    
    // Customize based on language preference
    if (options.language === 'typescript') {
      code = this.convertToTypeScript(code);
    }
    
    // Add validation if required
    if (ast.requirements.includes('validation')) {
      code = this.addValidation(code);
    }
    
    // Add testing if required
    if (ast.requirements.includes('testing')) {
      code = this.addTesting(code);
    }
    
    // Add security enhancements
    if (ast.requirements.includes('security')) {
      code = this.addSecurityEnhancements(code);
    }
    
    return code;
  }

  /**
   * Step 3: Analyze generated code
   */
  analyzeCode(code) {
    return {
      lines: code.split('\n').length,
      complexity: this.calculateComplexity(code),
      security: this.securityAnalysis(code),
      performance: this.performanceAnalysis(code),
      maintainability: this.assessMaintainability(code)
    };
  }

  /**
   * Calculate code complexity
   */
  calculateComplexity(code) {
    let complexity = 0;
    if (code.includes('if')) complexity += 1;
    if (code.includes('for')) complexity += 1;
    if (code.includes('while')) complexity += 1;
    if (code.includes('try')) complexity += 1;
    if (code.includes('async')) complexity += 1;
    
    return complexity;
  }

  /**
   * Security analysis
   */
  securityAnalysis(code) {
    const security = {
      score: 0,
      issues: [],
      recommendations: []
    };
    
    if (code.includes('bcrypt')) security.score += 2;
    if (code.includes('jwt')) security.score += 1;
    if (code.includes('validation')) security.score += 1;
    if (code.includes('rateLimit')) security.score += 1;
    
    if (!code.includes('bcrypt') && code.includes('password')) {
      security.issues.push('Plain text password handling detected');
      security.recommendations.push('Use bcrypt for password hashing');
    }
    
    if (!code.includes('validation')) {
      security.recommendations.push('Add input validation');
    }
    
    return security;
  }

  /**
   * Performance analysis
   */
  performanceAnalysis(code) {
    const performance = {
      score: 0,
      issues: [],
      recommendations: []
    };
    
    if (code.includes('async')) performance.score += 1;
    if (code.includes('index')) performance.score += 1;
    if (code.includes('cache')) performance.score += 1;
    
    if (code.includes('for') && !code.includes('forEach')) {
      performance.recommendations.push('Consider using forEach for array operations');
    }
    
    return performance;
  }

  /**
   * Assess code maintainability
   */
  assessMaintainability(code) {
    let score = 10;
    
    if (code.split('\n').length > 50) score -= 2;
    if (this.calculateComplexity(code) > 5) score -= 2;
    if (!code.includes('//')) score -= 1;
    if (!code.includes('function') && !code.includes('class')) score -= 1;
    
    return Math.max(0, score);
  }

  /**
   * Extract dependencies from code
   */
  extractDependencies(code) {
    const dependencies = [];
    const requirePattern = /require\(['"`]([^'"`]+)['"`]\)/g;
    const importPattern = /import.*from\s+['"`]([^'"`]+)['"`]/g;
    
    let match;
    while ((match = requirePattern.exec(code)) !== null) {
      dependencies.push(match[1]);
    }
    
    while ((match = importPattern.exec(code)) !== null) {
      dependencies.push(match[1]);
    }
    
    return [...new Set(dependencies)];
  }

  /**
   * Optimize generated code
   */
  optimizeCode(code, analysis) {
    let optimized = code;
    
    // Add performance optimizations
    if (analysis.performance.score < 3) {
      optimized = this.addPerformanceOptimizations(optimized);
    }
    
    // Add security improvements
    if (analysis.security.score < 3) {
      optimized = this.addSecurityImprovements(optimized);
    }
    
    return optimized;
  }

  /**
   * Add performance optimizations
   */
  addPerformanceOptimizations(code) {
    // Add caching if not present
    if (!code.includes('cache') && code.includes('database')) {
      code += '\n\n// Performance optimization: Add caching\nconst cache = new Map();\n';
    }
    
    return code;
  }

  /**
   * Add security improvements
   */
  addSecurityImprovements(code) {
    // Add rate limiting if not present
    if (!code.includes('rateLimit') && code.includes('express')) {
      code += '\n\n// Security: Add rate limiting\nconst rateLimit = require(\'express-rate-limit\');\n';
    }
    
    return code;
  }

  /**
   * Convert JavaScript to TypeScript
   */
  convertToTypeScript(code) {
    // Simple conversion - in real implementation this would be more sophisticated
    code = code.replace(/const (\w+) = async \(([^)]+)\) =>/g, 'const $1 = async ($2): Promise<any> =>');
    code = code.replace(/function (\w+)\(([^)]*)\)/g, 'function $1($2): any');
    
    return code;
  }

  /**
   * Add validation to code
   */
  addValidation(code) {
    if (!code.includes('validation')) {
      const validationCode = `
// Input validation
const validateInput = (data) => {
  const errors = [];
  if (!data.email || !data.email.includes('@')) {
    errors.push('Valid email is required');
  }
  if (!data.password || data.password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  return errors;
};`;
      code = code.replace('module.exports', validationCode + '\n\nmodule.exports');
    }
    return code;
  }

  /**
   * Add testing to code
   */
  addTesting(code) {
    if (!code.includes('test')) {
      const testCode = `
// Test suite
const test = require('tape');

test('Input validation', (t) => {
  const errors = validateInput({ email: 'invalid', password: '123' });
  t.equal(errors.length, 2, 'Should return 2 validation errors');
  t.end();
});`;
      code = code.replace('module.exports', testCode + '\n\nmodule.exports');
    }
    return code;
  }

  /**
   * Add security enhancements
   */
  addSecurityEnhancements(code) {
    if (!code.includes('helmet')) {
      const securityCode = `
// Security middleware
const helmet = require('helmet');
app.use(helmet());`;
      code = code.replace('const express', 'const express\n' + securityCode);
    }
    return code;
  }

  // Template methods
  getAuthTemplate() {
    return `// User Authentication Module
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userAuth = async (email, password) => {
  try {
    // Hash password securely
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user || !bcrypt.compare(password, user.password)) {
      throw new Error('Invalid credentials');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return { token, user: { id: user.id, email: user.email } };
  } catch (error) {
    throw new Error(\`Authentication failed: \${error.message}\`);
  }
};

module.exports = { userAuth };`;
  }

  getCRUDTemplate() {
    return `// CRUD Operations for User Management
class UserService {
  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }
  
  async read(userId) {
    return await User.findById(userId);
  }
  
  async update(userId, updateData) {
    return await User.findByIdAndUpdate(userId, updateData, { new: true });
  }
  
  async delete(userId) {
    return await User.findByIdAndDelete(userId);
  }
  
  async list(filters = {}) {
    return await User.find(filters);
  }
}

module.exports = UserService;`;
  }

  getAPITemplate() {
    return `// API Endpoint with Validation and Error Handling
const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Validation middleware
const validateUser = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().isLength({ min: 2 })
];

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  next();
};

// Protected route with validation
router.post('/users', validateUser, handleValidationErrors, async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;`;
  }

  getSecurityTemplate() {
    return `// Security Middleware and Utilities
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

// Security middleware
const securityMiddleware = [
  helmet(),
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  }),
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  })
];

// Password validation
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
};

module.exports = { securityMiddleware, validatePassword };`;
  }

  getGeneralTemplate() {
    return `// General Code Template
// Generated from natural language description

// This is a placeholder template.
// Please provide more specific requirements for better code generation.

const exampleFunction = async (input) => {
  try {
    // Your logic here
    const result = await processInput(input);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { exampleFunction };`;
  }
}

// Export the NLP Parser
module.exports = NLPParser;

// Example usage:
if (require.main === module) {
  const parser = new NLPParser();
  
  const examples = [
    'Create user authentication that checks email, hashes passwords securely, and returns JWT tokens',
    'Opret brugerautentificering der tjekker email, hasher adgangskoder sikkert og returnerer JWT tokens',
    'Build CRUD operations for user management with validation',
    'Create API endpoint with input validation and error handling'
  ];
  
  examples.forEach(async (example) => {
    console.log('\\n' + '='.repeat(60));
    console.log('Input:', example);
    const result = await parser.generateCode(example);
    console.log('\\nGenerated Code:');
    console.log(result.code);
    console.log('\\nAnalysis:', result.analysis);
  });
}