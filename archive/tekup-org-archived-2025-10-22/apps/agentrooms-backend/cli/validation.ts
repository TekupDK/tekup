/**
 * Shared CLI validation utilities
 *
 * Common validation functions used across different runtime CLI entry points.
 */

import type { Runtime } from "../runtime/types.ts";

/**
 * Detects if a file is an asdf shim by checking for the asdf exec pattern
 * @param runtime - Runtime abstraction for system operations
 * @param filePath - Path to the file to check
 * @returns boolean - True if file is an asdf shim
 */
async function isAsdfShim(
  runtime: Runtime,
  filePath: string,
): Promise<boolean> {
  try {
    const content = await runtime.readTextFile(filePath);
    return content.includes("asdf exec");
  } catch {
    return false;
  }
}

/**
 * Resolves the actual executable path for asdf shims
 * @param runtime - Runtime abstraction for system operations
 * @param command - The command name (e.g., "claude")
 * @returns Promise<string> - The resolved path to the actual executable
 */
async function resolveAsdfExecutablePath(
  runtime: Runtime,
  command: string,
): Promise<string> {
  const asdfWhichResult = await runtime.runCommand("asdf", ["which", command]);

  if (!asdfWhichResult.success || !asdfWhichResult.stdout.trim()) {
    throw new Error(`Failed to resolve asdf executable for ${command}`);
  }

  return asdfWhichResult.stdout.trim();
}

/**
 * Extracts actual executable path from bash script
 * Parses 'exec "path"' pattern from migrate-installer wrapper scripts
 * @param runtime - Runtime abstraction for system operations
 * @param scriptPath - Path to the script file
 * @returns string - The extracted executable path or original path if no match
 */
async function resolveWrapperScript(
  runtime: Runtime,
  scriptPath: string,
): Promise<string> {
  try {
    const content = await runtime.readTextFile(scriptPath);
    const match = content.match(/exec\s+"([^"]+)"/);
    return match ? match[1] : scriptPath;
  } catch {
    return scriptPath;
  }
}

/**
 * Resolves symlinks and wrapper scripts to actual executable paths
 * @param runtime - Runtime abstraction for system operations
 * @param claudePath - Initial path to resolve
 * @returns string - The resolved actual executable path
 */
async function resolveExecutablePath(
  runtime: Runtime,
  claudePath: string,
): Promise<string> {
  // Handle symlinks (typical npm install: /usr/local/bin/claude -> node_modules/.bin/claude)
  try {
    const stat = runtime.lstatSync(claudePath);
    if (stat.isSymlink) {
      // Node.js resolves symlinks automatically when executing, so we can use the symlink path
      return claudePath;
    }
  } catch {
    // Silently continue if stat check fails
  }

  // Handle shell scripts (migrate-installer: extract actual executable path)
  return await resolveWrapperScript(runtime, claudePath);
}

/**
 * Validates that the Claude CLI is available and working
 * Uses platform-specific command (`which` on Unix, `where` on Windows) for PATH detection
 * Resolves asdf shims to actual executable paths for SDK compatibility
 * Exits process if Claude CLI is not found or not working
 * @param runtime - Runtime abstraction for system operations
 * @param customPath - Optional custom path to claude executable to validate
 * @returns Promise<string> - The validated path to claude executable (resolved from shims)
 */
export async function validateClaudeCli(
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-agentrooms-backend-cli-va');

  runtime: Runtime,
  customPath?: string,
): Promise<string> {
  try {
    let claudePath = "";
    const platform = runtime.getPlatform();

    if (customPath) {
      // Use custom path if provided
      claudePath = customPath;
      logger.info(`🔍 Validating custom Claude path: ${customPath}`);
    } else {
      // Auto-detect using runtime's findExecutable method
      logger.info("🔍 Searching for Claude CLI in PATH...");
      const candidates = await runtime.findExecutable("claude");

      if (candidates.length === 0) {
        logger.error("❌ Claude CLI not found in PATH");
        logger.error("   Please install claude-code globally:");
        logger.error(
          "   Visit: https://claude.ai/code for installation instructions",
        );
        runtime.exit(1);
      }

      // Try each candidate until one works
      let validPath = "";
      for (const candidate of candidates) {
        const testResult = await runtime.runCommand(candidate, ["--version"]);

        if (testResult.success) {
          validPath = candidate;
          break;
        }
      }

      if (!validPath) {
        logger.error("❌ Claude CLI found but none are working properly");
        logger.error("   Found candidates:", candidates);
        logger.error(
          "   Please reinstall claude-code or check your installation",
        );
        runtime.exit(1);
      }

      claudePath = validPath;
    }

    // Resolve all types of wrappers to actual executable paths
    if (platform !== "windows") {
      // Check if the path is an asdf shim and resolve to actual executable (Unix-like systems only)
      if (await isAsdfShim(runtime, claudePath)) {
        logger.info(`🔍 Detected asdf shim: ${claudePath}`);
        try {
          const resolvedPath = await resolveAsdfExecutablePath(
            runtime,
            "claude",
          );
          logger.info(`📍 Resolved to actual executable: ${resolvedPath}`);
          claudePath = resolvedPath;
        } catch (error) {
          logger.error("❌ Failed to resolve asdf executable path");
          logger.error(
            `   Error: ${error instanceof Error ? error.message : String(error)}`,
          );
          logger.error(
            "   Make sure claude is installed through asdf and properly configured",
          );
          runtime.exit(1);
        }
      } else {
        // Resolve symlinks and wrapper scripts
        claudePath = await resolveExecutablePath(runtime, claudePath);
      }
    } else {
      // Windows: resolve symlinks and wrapper scripts
      claudePath = await resolveExecutablePath(runtime, claudePath);
    }

    // Final validation: verify the resolved path works
    // For custom paths: needed because original path wasn't tested
    // For auto-detected paths: needed because path may have been resolved/changed
    const versionResult = await runtime.runCommand(claudePath, ["--version"]);
    if (versionResult.success) {
      logger.info(`✅ Claude CLI found: ${versionResult.stdout.trim()}`);
      logger.info(`   Path: ${claudePath}`);
      return claudePath;
    } else {
      const pathType = customPath ? "Custom" : "Auto-detected";
      logger.error(`❌ ${pathType} Claude path not working after resolution`);
      logger.error(
        "   Please check your installation or try a different path",
      );
      runtime.exit(1);
    }
  } catch (error) {
    logger.error("❌ Failed to validate Claude CLI");
    logger.error(
      `   Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    runtime.exit(1);
  }
}
