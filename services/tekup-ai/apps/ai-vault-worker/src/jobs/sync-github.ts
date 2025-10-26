import { GitHubSync } from '@tekup-ai/vault-ingest';
import { GITHUB_REPOS, loadConfig } from '@tekup-ai/vault-core';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

const config = loadConfig();

/**
 * Sync all GitHub repositories in parallel
 */
export async function syncAllGitHubRepos(): Promise<void> {
  const startTime = Date.now();
  logger.info({ repos: GITHUB_REPOS.length }, 'Starting GitHub sync job (parallel)');

  const githubSync = new GitHubSync(config.GITHUB_TOKEN, supabase, logger);

  let successCount = 0;
  let errorCount = 0;

  // Sync repositories in parallel
  const syncPromises = GITHUB_REPOS.map(async (repo) => {
    try {
      await githubSync.syncRepository({
        owner: repo.owner,
        repo: repo.repo,
        branch: 'main'
      });
      successCount++;
      return { repo, success: true };
    } catch (error) {
      errorCount++;
      logger.error({ repo, error }, 'Failed to sync repository');
      return { repo, success: false, error };
    }
  });

  await Promise.all(syncPromises);

  const duration = Date.now() - startTime;
  logger.info({ 
    duration, 
    successCount, 
    errorCount, 
    totalRepos: GITHUB_REPOS.length 
  }, 'GitHub sync job completed');
}
