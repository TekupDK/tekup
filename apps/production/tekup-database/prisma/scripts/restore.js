"use strict";
/**
 * Database Restore Script
 *
 * Restores database from a backup file
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
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://tekup:tekup123@localhost:5432/tekup_db';
async function restore(options) {
    const { backupFile, clean = false } = options;
    if (!fs.existsSync(backupFile)) {
        throw new Error(`Backup file not found: ${backupFile}`);
    }
    console.log(`📥 Restoring database from: ${backupFile}`);
    if (clean) {
        console.log(`⚠️  Clean restore - will drop existing data!`);
    }
    try {
        let command = `psql "${DATABASE_URL}"`;
        if (clean) {
            command += ` --clean`;
        }
        command += ` < "${backupFile}"`;
        await execAsync(command);
        console.log(`✅ Database restored successfully!`);
    }
    catch (error) {
        console.error(`❌ Restore failed:`, error);
        throw error;
    }
}
// CLI usage
const args = process.argv.slice(2);
const backupFile = args[0];
const clean = args.includes('--clean');
if (!backupFile) {
    console.error('Usage: tsx restore.ts <backup-file> [--clean]');
    process.exit(1);
}
restore({ backupFile, clean }).catch(console.error);
//# sourceMappingURL=restore.js.map