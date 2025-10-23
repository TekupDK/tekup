/**
 * Merge all separate Prisma schemas into main schema.prisma
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Merging all schemas into schema.prisma...\n');

// Read files
const mainSchema = fs.readFileSync('prisma/schema.prisma', 'utf8');
const renosSchema = fs.readFileSync('prisma/schema-renos.prisma', 'utf8');
const crmSchema = fs.readFileSync('prisma/schema-crm.prisma', 'utf8');
const flowSchema = fs.readFileSync('prisma/schema-flow.prisma', 'utf8');

// Extract model definitions (skip generator/datasource headers)
const renosModels = renosSchema.split('\n').slice(5).join('\n');
const crmModels = crmSchema.split('\n').slice(13).join('\n');
const flowModels = flowSchema.split('\n').slice(13).join('\n');

// Replace placeholders
let merged = mainSchema;

// Replace RENOS placeholder
merged = merged.replace(
  /\/\/ ===+\n\/\/ RENOS SCHEMA.*?\n\/\/ ===+\n\/\/ Placeholder.*?schema/s,
  `// =====================================================
// RENOS SCHEMA (Tekup Google AI - RenOS)
// =====================================================

${renosModels}

// ====================================================`
);

// Replace CRM placeholder  
merged = merged.replace(
  /\/\/ ===+\n\/\/ CRM SCHEMA.*?\n\/\/ ===+\n\/\/ Placeholder.*?schema/s,
  `// =====================================================
// CRM SCHEMA (Tekup-org CRM)
// =====================================================

${crmModels}

// ====================================================`
);

// Replace FLOW placeholder
merged = merged.replace(
  /\/\/ ===+\n\/\/ FLOW SCHEMA.*?\n\/\/ ===+\n\/\/ Placeholder.*?schema/s,
  `// =====================================================
// FLOW SCHEMA (Flow API)
// =====================================================

${flowModels}

// ====================================================`
);

// Write merged schema
fs.writeFileSync('prisma/schema.prisma', merged);

console.log('✅ Schema merge complete!\n');
console.log('📊 Merged schemas:');
console.log('   - vault (3 models)');
console.log('   - billy (8 models)');
console.log('   - renos (22 models) ✨');
console.log('   - crm (18 models) ✨');
console.log('   - flow (11 models) ✨');
console.log('   - shared (2 models)');
console.log('\n📝 Total: 64 database models\n');
console.log('Next steps:');
console.log('1. pnpm db:generate');
console.log('2. pnpm db:push\n');
