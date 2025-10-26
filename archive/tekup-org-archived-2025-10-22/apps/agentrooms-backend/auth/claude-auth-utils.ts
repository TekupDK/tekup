import path from "node:path";
import { fileURLToPath } from "node:url";

// Get __dirname equivalent for ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Prepares the authentication environment for Claude Code CLI execution
 * This includes setting up environment variables and preload script
 * to intercept security commands and provide OAuth credentials
 */
export async function prepareClaudeAuthEnvironment(): Promise<{
  env: Record<string, string>;
  executableArgs: string[];
}> {
  // Check if we have valid OAuth credentials by reading from the credentials file
  const credentialsPath = path.join(
    process.env.HOME || process.cwd(),
    ".claude-credentials.json"
  );
  
  let hasValidCredentials = false;
  try {
    const fs = await import("fs");
    const credentialsData = await fs.promises.readFile(credentialsPath, "utf8");
    const credentials = JSON.parse(credentialsData);
    
    // Check if we have a valid access token
    if (credentials?.claudeAiOauth?.accessToken && credentials?.claudeAiOauth?.expiresAt) {
      const now = Date.now();
      const expiresAt = credentials.claudeAiOauth.expiresAt;
      // Consider valid if expires more than 5 minutes from now
      hasValidCredentials = expiresAt > (now + 5 * 60 * 1000);
      
      logger.info(`[AUTH] Found credentials for user: ${credentials.claudeAiOauth.account?.email_address}`);
      logger.info(`[AUTH] Token expires at: ${new Date(expiresAt).toISOString()}`);
      logger.info(`[AUTH] Current time: ${new Date(now).toISOString()}`);
      logger.info(`[AUTH] Token valid: ${hasValidCredentials}`);
    } else {
      logger.info(`[AUTH] Missing required credential fields:`);
      logger.info(`[AUTH] - accessToken: ${!!credentials?.claudeAiOauth?.accessToken}`);
      logger.info(`[AUTH] - expiresAt: ${!!credentials?.claudeAiOauth?.expiresAt}`);
    }
  } catch (error) {
    // Credentials file doesn't exist or is invalid
    logger.info(`[AUTH] Could not read credentials file: ${error instanceof Error ? error.message : String(error)}`);
    hasValidCredentials = false;
  }
  
  if (!hasValidCredentials) {
    logger.info("[AUTH] No valid OAuth credentials found, skipping auth setup");
    return {
      env: {},
      executableArgs: []
    };
  }

  // Get the preload script path - it should be relative to the backend directory
  const preloadScriptPath = path.resolve(
    __dirname,
    "./preload-script.cjs"
  );

  // Use the same credentials path

  // Create the authentication environment
  const authEnv: Record<string, string> = {
    // Set the credentials path for the preload script to read from
    CLAUDE_CREDENTIALS_PATH: credentialsPath,
    // Enable debug logging for the preload script if needed
    DEBUG_PRELOAD_SCRIPT: "1",
  };

  // Add NODE_OPTIONS to include the preload script
  const nodeOptions = `--require "${preloadScriptPath.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  authEnv.NODE_OPTIONS = nodeOptions;

  // Add Claude configuration directories
  authEnv.CLAUDE_CONFIG_DIR = path.join(process.env.HOME || process.cwd(), ".claude-config");
  authEnv.CLAUDE_CREDENTIALS_PATH = credentialsPath;

  logger.info("[AUTH] Prepared Claude auth environment:");
  logger.info(`[AUTH] Preload script: ${preloadScriptPath}`);
  logger.info(`[AUTH] Credentials path: ${credentialsPath}`);
  logger.info(`[AUTH] NODE_OPTIONS: ${nodeOptions}`);
  
  // Verify preload script exists
  const fs = await import("fs");
  if (!fs.existsSync(preloadScriptPath)) {
    logger.error(`[AUTH] ERROR: Preload script not found at ${preloadScriptPath}`);
    logger.error(`[AUTH] __dirname is: ${__dirname}`);
    logger.error(`[AUTH] Resolved path is: ${preloadScriptPath}`);
  } else {
    logger.info(`[AUTH] Preload script verified at ${preloadScriptPath}`);
    logger.info(`[AUTH] NODE_OPTIONS will be: ${nodeOptions}`);
  }

  return {
    env: authEnv,
    executableArgs: []
  };
}

/**
 * Writes OAuth credentials to the credentials file
 * @param claudeAuth - OAuth credentials to write, if not provided uses existing file
 */
export async function writeClaudeCredentialsFile(claudeAuth?: {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-agentrooms-backend-auth-c');

  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  subscriptionType: string;
  account: {
    email_address: string;
    uuid: string;
  };
}): Promise<void> {
  const credentialsPath = path.join(
    process.env.HOME || process.cwd(),
    ".claude-credentials.json"
  );

  if (claudeAuth) {
    // Write provided OAuth credentials
    const credentials = {
      claudeAiOauth: claudeAuth
    };
    
    const fs = await import("fs");
    await fs.promises.writeFile(
      credentialsPath, 
      JSON.stringify(credentials, null, 2), 
      { mode: 0o600 }
    );
    
    logger.info("[AUTH] OAuth credentials written to:", credentialsPath);
    logger.info("[AUTH] Credentials written for user:", claudeAuth.account?.email_address);
    logger.info("[AUTH] Token expires at:", new Date(claudeAuth.expiresAt).toISOString());
    
    // Verify the file was written correctly by reading it back
    try {
      const writtenData = await fs.promises.readFile(credentialsPath, "utf8");
      const parsedData = JSON.parse(writtenData);
      logger.info("[AUTH] Credentials file content preview:");
      logger.info("[AUTH] - Has claudeAiOauth:", !!parsedData.claudeAiOauth);
      logger.info("[AUTH] - Has accessToken:", !!parsedData.claudeAiOauth?.accessToken);
      logger.info("[AUTH] - AccessToken length:", parsedData.claudeAiOauth?.accessToken?.length || 0);
      logger.info("[AUTH] - Has refreshToken:", !!parsedData.claudeAiOauth?.refreshToken);
      if (parsedData.claudeAiOauth?.accessToken) {
        logger.info("[AUTH] Verification: Credentials file written and readable");
      } else {
        logger.info("[AUTH] WARNING: Credentials file written but missing accessToken");
      }
    } catch (verifyError) {
      logger.info("[AUTH] ERROR: Could not verify written credentials file:", verifyError);
    }
  } else {
    // In the backend context without provided auth, credentials are managed by the Electron main process
    logger.info("[AUTH] Backend context - using existing credentials file");
  }
}