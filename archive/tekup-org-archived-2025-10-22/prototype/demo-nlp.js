#!/usr/bin/env node

/**
 * TekUp NLP - Demonstration Script
 * Shows the Natural Language Programming system in action
 */

const NLPParser = require('./nlp-advanced');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader() {
  console.log('\n' + '='.repeat(80));
  console.log(colorize('🤖 TEKUP NATURAL LANGUAGE PROGRAMMING DEMO', 'bright'));
  console.log(colorize('   Code-Free Development with AI Translation Layer', 'cyan'));
  console.log('='.repeat(80));
  console.log(colorize('Vision: Beskrive software functionality på dansk/engelsk og få executable code', 'yellow'));
  console.log(colorize('Vision: Describe software functionality in Danish/English and get executable code', 'yellow'));
  console.log('='.repeat(80) + '\n');
}

function printStep(step, description) {
  console.log(colorize(`\n${step}`, 'magenta'));
  console.log(colorize(description, 'white'));
}

function printResult(title, content, type = 'info') {
  const color = type === 'success' ? 'green' : type === 'warning' ? 'yellow' : type === 'error' ? 'red' : 'blue';
  console.log(colorize(`\n${title}:`, color));
  console.log(content);
}

function printCode(code, language = 'javascript') {
  console.log(colorize(`\n${language.toUpperCase()}:`, 'cyan'));
  console.log('```' + language);
  console.log(code);
  console.log('```');
}

function printAnalysis(analysis) {
  console.log(colorize('\n📊 CODE ANALYSIS:', 'bright'));
  console.log(`Lines of Code: ${analysis.lines}`);
  console.log(`Complexity Score: ${analysis.complexity}`);
  console.log(`Maintainability: ${analysis.maintainability}/10`);
  
  if (analysis.security.score > 0) {
    console.log(colorize(`Security Score: ${analysis.security.score}/4`, 'green'));
  }
  
  if (analysis.performance.score > 0) {
    console.log(colorize(`Performance Score: ${analysis.performance.score}/3`, 'blue'));
  }
}

async function demonstrateNLP() {
  const parser = new NLPParser();
  
  const examples = [
    {
      title: '🔐 User Authentication (English)',
      input: 'Create user authentication that checks email, hashes passwords securely, and returns JWT tokens',
      options: { language: 'javascript' }
    },
    {
      title: '🔐 Brugerautentificering (Dansk)',
      input: 'Opret brugerautentificering der tjekker email, hasher adgangskoder sikkert og returnerer JWT tokens',
      options: { language: 'javascript' }
    },
    {
      title: '📊 CRUD Operations',
      input: 'Build CRUD operations for user management with validation and error handling',
      options: { language: 'typescript' }
    },
    {
      title: '🌐 API Endpoint',
      input: 'Create API endpoint with input validation, error handling, and security middleware',
      options: { language: 'javascript' }
    },
    {
      title: '🛡️ Security Module',
      input: 'Build security middleware with rate limiting, CORS, and password validation',
      options: { language: 'javascript' }
    }
  ];
  
  for (let i = 0; i < examples.length; i++) {
    const example = examples[i];
    
    console.log(colorize(`\n${'='.repeat(80)}`, 'bright'));
    console.log(colorize(`EXAMPLE ${i + 1}: ${example.title}`, 'bright'));
    console.log(colorize(`${'='.repeat(80)}`, 'bright'));
    
    printStep('📝 INPUT', example.input);
    
    try {
      printStep('🤖 PROCESSING', 'Natural Language → AST → Optimized Code');
      
      const result = await parser.generateCode(example.input, example.options);
      
      printResult('🌳 Abstract Syntax Tree', JSON.stringify(result.ast, null, 2), 'info');
      
      printCode(result.code, example.options.language || 'javascript');
      
      printAnalysis(result.analysis);
      
      if (result.dependencies.length > 0) {
        printResult('📦 Dependencies', result.dependencies.join(', '), 'info');
      }
      
      if (result.security.recommendations.length > 0) {
        printResult('🛡️ Security Recommendations', result.security.recommendations.join('\n'), 'warning');
      }
      
      if (result.performance.recommendations.length > 0) {
        printResult('⚡ Performance Recommendations', result.performance.recommendations.join('\n'), 'warning');
      }
      
    } catch (error) {
      printResult('❌ Error', error.message, 'error');
    }
    
    // Pause between examples
    if (i < examples.length - 1) {
      console.log(colorize('\n⏳ Press Enter to continue to next example...', 'yellow'));
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });
    }
  }
}

function printConclusion() {
  console.log(colorize('\n' + '='.repeat(80), 'bright'));
  console.log(colorize('🎯 NATURAL LANGUAGE PROGRAMMING BENEFITS', 'bright'));
  console.log(colorize('='.repeat(80), 'bright'));
  
  const benefits = [
    '🚀 Faster Development: Describe functionality in natural language instead of writing code',
    '🌍 Multilingual Support: Work in Danish, English, or any natural language',
    '🔒 Built-in Security: Automatic security best practices and validation',
    '⚡ Performance Optimized: AI-generated code includes performance considerations',
    '🧪 Auto-Testing: Generated code includes test frameworks and examples',
    '📚 Learning Tool: Great for developers learning new patterns and best practices',
    '🔄 Iterative Improvement: Easy to refine requirements and regenerate code',
    '🎨 Multiple Outputs: Generate JavaScript, TypeScript, Python, or other languages'
  ];
  
  benefits.forEach(benefit => {
    console.log(colorize(benefit, 'green'));
  });
  
  console.log(colorize('\n' + '='.repeat(80), 'bright'));
  console.log(colorize('🔮 FUTURE ENHANCEMENTS', 'bright'));
  console.log(colorize('='.repeat(80), 'bright'));
  
  const enhancements = [
    '🤖 Advanced AI Models: Integration with GPT-4, Claude, or other LLMs',
    '🔍 Semantic Analysis: Better understanding of complex requirements',
    '🏗️ Architecture Patterns: Generate entire application architectures',
    '📱 Multi-Platform: Generate code for web, mobile, desktop, and backend',
    '🔗 Database Integration: Automatic database schema and query generation',
    '☁️ Cloud Deployment: Generate deployment configurations and infrastructure',
    '📊 Analytics: Track code generation patterns and improve templates',
    '👥 Collaboration: Team-based code generation with version control'
  ];
  
  enhancements.forEach(enhancement => {
    console.log(colorize(enhancement, 'blue'));
  });
  
  console.log(colorize('\n' + '='.repeat(80), 'bright'));
  console.log(colorize('💡 GAME CHANGER: Programming becomes accessible to non-developers', 'bright'));
  console.log(colorize('='.repeat(80), 'bright'));
}

async function main() {
  try {
    printHeader();
    
    console.log(colorize('🚀 Starting Natural Language Programming demonstration...', 'green'));
    console.log(colorize('This demo shows how the AI Translation Layer works:', 'cyan'));
    console.log(colorize('1. Natural Language → Abstract Syntax Tree', 'white'));
    console.log(colorize('2. AST → Optimized Code Generation', 'white'));
    console.log(colorize('3. Automatic Testing and Validation', 'white'));
    console.log(colorize('4. Multi-language Output Support', 'white'));
    
    await demonstrateNLP();
    printConclusion();
    
  } catch (error) {
    console.error(colorize('❌ Demo failed:', 'red'), error);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { demonstrateNLP, printHeader, printConclusion };