// MCP Memory.json Converter - NDJSON to Valid JSON
// Converts newline-delimited JSON to proper memory server format
import fs from 'fs';
import path from 'path';

const MEMORY_FILE_PATH = 'C:\\Users\\empir\\.codeium\\windsurf\\memory.json';
const BACKUP_PATH = `${MEMORY_FILE_PATH}.backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;

console.log('🔄 MCP Memory.json Conversion Tool\n');

// Step 1: Backup
console.log('📦 Creating backup...');
try {
  fs.copyFileSync(MEMORY_FILE_PATH, BACKUP_PATH);
  console.log(`✅ Backup created: ${BACKUP_PATH}\n`);
} catch (err) {
  console.error(`❌ Backup failed: ${err.message}`);
  process.exit(1);
}

// Step 2: Read and parse NDJSON
console.log('📖 Reading NDJSON format...');
let ndjson;
try {
  ndjson = fs.readFileSync(MEMORY_FILE_PATH, 'utf8');
} catch (err) {
  console.error(`❌ Read failed: ${err.message}`);
  process.exit(1);
}

const lines = ndjson.split('\n').filter(line => line.trim());
console.log(`Found ${lines.length} lines of NDJSON\n`);

// Step 3: Parse entities and relations
console.log('🔍 Parsing entities and relations...');
const entities = [];
const relations = [];
let parseErrors = 0;

for (const line of lines) {
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'entity') {
      entities.push(obj);
    } else if (obj.type === 'relation') {
      relations.push(obj);
    }
  } catch (err) {
    parseErrors++;
    console.warn(`⚠️  Parse error on line: ${line.substring(0, 50)}...`);
  }
}

console.log(`✅ Parsed ${entities.length} entities, ${relations.length} relations`);
if (parseErrors > 0) {
  console.log(`⚠️  ${parseErrors} lines skipped due to parse errors`);
}
console.log();

// Step 4: Create valid memory format
console.log('🔨 Creating valid memory.json format...');
const validMemory = {
  entities,
  relations,
  observations: []
};

// Step 5: Write new file
console.log('💾 Writing converted file...');
try {
  fs.writeFileSync(
    MEMORY_FILE_PATH,
    JSON.stringify(validMemory, null, 2),
    'utf8'
  );
  console.log(`✅ File written: ${MEMORY_FILE_PATH}\n`);
} catch (err) {
  console.error(`❌ Write failed: ${err.message}`);
  console.error(`Restoring from backup: ${BACKUP_PATH}`);
  fs.copyFileSync(BACKUP_PATH, MEMORY_FILE_PATH);
  process.exit(1);
}

// Step 6: Validate
console.log('🔍 Validating converted file...');
try {
  const test = JSON.parse(fs.readFileSync(MEMORY_FILE_PATH, 'utf8'));
  console.log('✅ Valid JSON confirmed\n');
  
  console.log('📊 Summary:');
  console.log(`   Entities: ${test.entities.length}`);
  console.log(`   Relations: ${test.relations.length}`);
  console.log(`   Observations: ${test.observations.length}`);
  console.log();
  
  console.log('🎉 Conversion complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Restart Windsurf IDE completely');
  console.log('2. Check MCP server logs (Settings → MCP → View Logs)');
  console.log('3. Verify memory server starts without exit code 1');
  console.log('4. Test memory tools in Cascade chat');
  console.log();
  console.log(`Backup saved at: ${BACKUP_PATH}`);
  
} catch (err) {
  console.error(`❌ Validation failed: ${err.message}`);
  console.error(`Restoring from backup: ${BACKUP_PATH}`);
  fs.copyFileSync(BACKUP_PATH, MEMORY_FILE_PATH);
  process.exit(1);
}
