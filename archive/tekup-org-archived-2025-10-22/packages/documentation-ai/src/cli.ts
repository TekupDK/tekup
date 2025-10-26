#!/usr/bin/env node

import { Command } from 'commander';
import { ChangeDetector } from './change-detector.js';
import { DocumentationAI } from './documentation-ai.js';
import { TranslationService } from './translation-service.js';
import { AIConfig, ChangeDetectionConfig } from './types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const program = new Command();

program
  .name('tekup-docs-ai')
  .description('TekUp Documentation AI CLI')
  .version('0.1.0');

// Configuration loading
async function loadConfig(): Promise<{ ai: AIConfig; changeDetection: ChangeDetectionConfig }> {
  const configPath = path.join(process.cwd(), '.tekup-docs-ai.json');
  
  try {
    const configContent = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch {
    // Return default configuration
    return {
      ai: {
        openai: {
          apiKey: process.env.OPENAI_API_KEY || '',
          model: 'gpt-4',
          maxTokens: 4000
        },
        gemini: {
          apiKey: process.env.GEMINI_API_KEY || '',
          model: 'gemini-pro'
        },
        defaultProvider: 'openai',
        translationProvider: 'openai'
      },
      changeDetection: {
        watchPaths: ['apps/', 'packages/', 'src/'],
        ignorePaths: ['node_modules/', 'dist/', 'build/', '.git/', 'coverage/'],
        documentationPaths: ['docs/', 'README.md', '**/*.md'],
        autoSync: true,
        validationEnabled: true,
        rollbackEnabled: true,
        notificationChannels: []
      }
    };
  }
}

// Initialize configuration
program
  .command('init')
  .description('Initialize TekUp Documentation AI configuration')
  .option('--openai-key <key>', 'OpenAI API key')
  .option('--gemini-key <key>', 'Gemini API key')
  .option('--provider <provider>', 'Default AI provider (openai|gemini)', 'openai')
  .action(async (options) => {
    const config = {
      ai: {
        openai: {
          apiKey: options.openaiKey || process.env.OPENAI_API_KEY || '',
          model: 'gpt-4',
          maxTokens: 4000
        },
        gemini: {
          apiKey: options.geminiKey || process.env.GEMINI_API_KEY || '',
          model: 'gemini-pro'
        },
        defaultProvider: options.provider,
        translationProvider: options.provider
      },
      changeDetection: {
        watchPaths: ['apps/', 'packages/', 'src/'],
        ignorePaths: ['node_modules/', 'dist/', 'build/', '.git/', 'coverage/'],
        documentationPaths: ['docs/', 'README.md', '**/*.md'],
        autoSync: true,
        validationEnabled: true,
        rollbackEnabled: true,
        notificationChannels: []
      }
    };

    const configPath = path.join(process.cwd(), '.tekup-docs-ai.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    console.log('✅ Configuration initialized at .tekup-docs-ai.json');
    console.log('📝 Edit the configuration file to customize settings');
  });

// Start change detection
program
  .command('watch')
  .description('Start watching for code changes and auto-update documentation')
  .option('--no-auto-sync', 'Disable automatic documentation updates')
  .option('--no-validation', 'Disable documentation validation')
  .option('--no-rollback', 'Disable automatic rollback on errors')
  .action(async (options) => {
    const config = await loadConfig();
    
    // Override config with CLI options
    config.changeDetection.autoSync = options.autoSync !== false;
    config.changeDetection.validationEnabled = options.validation !== false;
    config.changeDetection.rollbackEnabled = options.rollback !== false;

    const detector = new ChangeDetector(process.cwd(), config.ai, config.changeDetection);

    // Set up event listeners
    detector.on('watching-started', () => {
      console.log('🔍 Started watching for changes...');
    });

    detector.on('changes-detected', (changes) => {
      console.log(`📝 Detected ${changes.length} changes`);
      changes.forEach(change => {
        console.log(`  ${change.type}: ${change.file}`);
      });
    });

    detector.on('updates-generated', (updates) => {
      console.log(`📚 Generated ${updates.length} documentation updates`);
      updates.forEach(update => {
        console.log(`  ${update.type} (${update.priority}): ${update.files.join(', ')}`);
      });
    });

    detector.on('processing-completed', ({ changes, updates }) => {
      console.log(`✅ Processing completed: ${changes.length} changes, ${updates.length} updates applied`);
    });

    detector.on('rollback-completed', (rollback) => {
      console.log(`🔄 Rollback completed: ${rollback.reason}`);
    });

    detector.on('processing-error', ({ error }) => {
      console.error('❌ Processing error:', error.message);
    });

    // Start watching
    await detector.startWatching();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping change detection...');
      await detector.stopWatching();
      process.exit(0);
    });

    // Keep the process running
    console.log('Press Ctrl+C to stop watching');
  });

// Generate documentation
program
  .command('generate')
  .description('Generate documentation from current codebase')
  .option('--output <dir>', 'Output directory for generated documentation', 'docs/generated')
  .option('--format <format>', 'Output format (markdown|html|json)', 'markdown')
  .action(async (options) => {
    const config = await loadConfig();
    const docAI = new DocumentationAI(config.ai);

    console.log('📊 Analyzing codebase...');
    const snapshot = await docAI.createCodebaseSnapshot(process.cwd());
    
    console.log('🤖 Generating documentation...');
    const documentation = await docAI.generateDocumentation(snapshot);

    // Ensure output directory exists
    await fs.mkdir(options.output, { recursive: true });

    // Write documentation files
    for (const doc of documentation) {
      const fileName = `${doc.id}.md`;
      const filePath = path.join(options.output, fileName);
      
      const content = `# ${doc.title}

${doc.content}

---
*Generated by TekUp Documentation AI on ${doc.lastUpdated.toISOString()}*
*Type: ${doc.type} | Language: ${doc.language} | Version: ${doc.version}*
`;

      await fs.writeFile(filePath, content);
      console.log(`📄 Generated: ${fileName}`);
    }

    console.log(`✅ Generated ${documentation.length} documentation files in ${options.output}`);
  });

// Translate documentation
program
  .command('translate')
  .description('Translate documentation to Danish or English')
  .argument('<input>', 'Input file or directory')
  .option('--to <language>', 'Target language (da|en)', 'da')
  .option('--output <dir>', 'Output directory', 'docs/translated')
  .action(async (input, options) => {
    const config = await loadConfig();
    const translator = new TranslationService(config.ai);

    console.log(`🌐 Translating to ${options.to}...`);

    // Check if input is file or directory
    const inputStat = await fs.stat(input);
    const files: string[] = [];

    if (inputStat.isFile()) {
      files.push(input);
    } else {
      // Scan directory for markdown files
      const { glob } = await import('glob');
      const markdownFiles = await glob('**/*.md', { cwd: input });
      files.push(...markdownFiles.map(f => path.join(input, f)));
    }

    // Ensure output directory exists
    await fs.mkdir(options.output, { recursive: true });

    // Translate files
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const fileName = path.basename(file);
        
        console.log(`📝 Translating: ${fileName}`);
        
        const result = options.to === 'da' 
          ? await translator.translateToDanish(content, `Documentation file: ${fileName}`)
          : await translator.translateToEnglish(content, `Documentation file: ${fileName}`);

        const outputPath = path.join(options.output, fileName);
        await fs.writeFile(outputPath, result.translatedContent);
        
        console.log(`✅ Translated: ${fileName} (confidence: ${(result.confidence * 100).toFixed(1)}%)`);
        
        if (result.warnings.length > 0) {
          console.log(`⚠️  Warnings: ${result.warnings.join(', ')}`);
        }
      } catch (error) {
        console.error(`❌ Error translating ${file}:`, error);
      }
    }

    console.log(`🎉 Translation completed! Files saved to ${options.output}`);
  });

// Validate documentation
program
  .command('validate')
  .description('Validate documentation accuracy and completeness')
  .option('--fix', 'Automatically fix validation issues where possible')
  .action(async (options) => {
    const config = await loadConfig();
    const detector = new ChangeDetector(process.cwd(), config.ai, config.changeDetection);

    console.log('🔍 Validating documentation...');
    const validation = await detector.validateDocumentation();

    if (validation.success) {
      console.log('✅ Documentation validation passed!');
    } else {
      console.log('❌ Documentation validation failed:');
      
      validation.errors.forEach(error => {
        console.log(`  ❌ ${error}`);
      });

      if (validation.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        validation.warnings.forEach(warning => {
          console.log(`  ⚠️  ${warning}`);
        });
      }

      if (validation.affectedFiles.length > 0) {
        console.log('\n📁 Affected files:');
        validation.affectedFiles.forEach(file => {
          console.log(`  📄 ${file}`);
        });
      }

      process.exit(1);
    }
  });

// Rollback command
program
  .command('rollback')
  .description('Rollback recent documentation changes')
  .option('--reason <reason>', 'Reason for rollback', 'Manual rollback')
  .action(async (options) => {
    const config = await loadConfig();
    const detector = new ChangeDetector(process.cwd(), config.ai, config.changeDetection);

    console.log('🔄 Performing rollback...');
    await detector.performRollback(options.reason);
    console.log('✅ Rollback completed');
  });

// Status command
program
  .command('status')
  .description('Show current status and recent activity')
  .action(async () => {
    const config = await loadConfig();
    const detector = new ChangeDetector(process.cwd(), config.ai, config.changeDetection);

    console.log('📊 TekUp Documentation AI Status\n');
    
    // Show configuration
    console.log('⚙️  Configuration:');
    console.log(`  AI Provider: ${config.ai.defaultProvider}`);
    console.log(`  Translation Provider: ${config.ai.translationProvider}`);
    console.log(`  Auto-sync: ${config.changeDetection.autoSync ? '✅' : '❌'}`);
    console.log(`  Validation: ${config.changeDetection.validationEnabled ? '✅' : '❌'}`);
    console.log(`  Rollback: ${config.changeDetection.rollbackEnabled ? '✅' : '❌'}`);
    
    // Show recent changes
    console.log('\n📝 Recent Changes:');
    const recentChanges = await detector.getRecentChanges(5);
    if (recentChanges.length === 0) {
      console.log('  No recent changes detected');
    } else {
      recentChanges.forEach(change => {
        console.log(`  ${change.type}: ${change.file} (${change.timestamp.toLocaleString()})`);
      });
    }

    // Show rollback history
    console.log('\n🔄 Rollback History:');
    const rollbacks = detector.getRollbackHistory();
    if (rollbacks.length === 0) {
      console.log('  No rollbacks performed');
    } else {
      rollbacks.slice(-5).forEach(rollback => {
        console.log(`  ${rollback.id}: ${rollback.reason} (${rollback.timestamp.toLocaleString()})`);
      });
    }
  });

program.parse();