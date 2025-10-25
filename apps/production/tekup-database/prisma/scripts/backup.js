"use strict";
/**
 * Database Backup Script
 *
 * Creates a backup of the entire database or specific schemas
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://tekup:tekup123@localhost:5432/tekup_db';
const BACKUP_DIR = process.env.BACKUP_PATH || './backups';
async function backup(options = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const schema = options.schema || 'all';
    const filename = options.outputFile || `backup_${schema}_${timestamp}.sql`;
    const outputPath = path.join(BACKUP_DIR, filename);
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    console.log(`📦 Creating backup: ${filename}`);
    console.log(`   Schema: ${schema}`);
    console.log(`   Output: ${outputPath}`);
    try {
        let command = `pg_dump "${DATABASE_URL}"`;
        if (options.schema && options.schema !== 'all') {
            command += ` --schema=${options.schema}`;
        }
        command += ` > "${outputPath}"`;
        await execAsync(command);
        const stats = fs.statSync(outputPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`✅ Backup created successfully!`);
        console.log(`   Size: ${fileSizeMB} MB`);
        console.log(`   Location: ${outputPath}`);
        return outputPath;
    }
    catch (error) {
        console.error(`❌ Backup failed:`, error);
        throw error;
    }
}
// CLI usage
const args = process.argv.slice(2);
const schemaArg = args.find(arg => arg.startsWith('--schema='));
const schema = schemaArg ? schemaArg.split('=')[1] : undefined;
backup({ schema }).catch(console.error);
//# sourceMappingURL=backup.js.map