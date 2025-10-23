/**
 * Example usage of Vault client
 */

import { vault } from '../src/client/vault';

async function example() {
  // Create a document
  const doc = await vault.createDocument({
    source: 'github',
    repository: 'TekupDK/tekup',
    path: 'README.md',
    content: '# Example Document',
    metadata: { type: 'documentation', language: 'markdown' },
  });

  console.log('Created document:', doc.id);

  // Search documents
  const docs = await vault.findDocuments({
    source: 'github',
    limit: 10,
  });

  console.log(`Found ${docs.length} documents`);

  // Update sync status
  await vault.updateSyncStatus(
    'github',
    'TekupDK/tekup',
    'success'
  );

  console.log('Sync status updated');
}

example().catch(console.error);
