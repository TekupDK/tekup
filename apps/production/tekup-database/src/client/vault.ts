/**
 * Vault Schema Client
 * TekupVault-specific database queries
 */

import { prisma } from './index';

export const vault = {
  // Documents
  async findDocuments(filters?: { source?: string; repository?: string; limit?: number }) {
    return prisma.vaultDocument.findMany({
      where: {
        ...(filters?.source && { source: filters.source }),
        ...(filters?.repository && { repository: filters.repository }),
      },
      take: filters?.limit || 100,
      orderBy: { updatedAt: 'desc' },
      include: { embedding: true },
    });
  },

  async createDocument(data: {
    source: string;
    repository: string;
    path: string;
    content: string;
    metadata?: any;
    sha?: string;
  }) {
    return prisma.vaultDocument.create({ data });
  },

  async upsertDocument(data: {
    source: string;
    repository: string;
    path: string;
    content: string;
    metadata?: any;
    sha?: string;
  }) {
    return prisma.vaultDocument.upsert({
      where: {
        source_repository_path: {
          source: data.source,
          repository: data.repository,
          path: data.path,
        },
      },
      create: data,
      update: {
        content: data.content,
        metadata: data.metadata,
        sha: data.sha,
      },
    });
  },

  // Embeddings
  async createEmbedding(documentId: string, embedding: number[]) {
    // Note: pgvector embeddings need special handling
    return prisma.$executeRaw`
      INSERT INTO vault.embeddings (document_id, embedding)
      VALUES (${documentId}::uuid, ${JSON.stringify(embedding)}::vector)
      ON CONFLICT (document_id) DO UPDATE SET embedding = EXCLUDED.embedding
    `;
  },

  // Sync Status
  async getSyncStatus(source?: string, repository?: string) {
    return prisma.vaultSyncStatus.findMany({
      where: {
        ...(source && { source }),
        ...(repository && { repository }),
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async updateSyncStatus(
    source: string,
    repository: string,
    status: 'pending' | 'in_progress' | 'success' | 'error',
    errorMessage?: string
  ) {
    return prisma.vaultSyncStatus.upsert({
      where: {
        source_repository: { source, repository },
      },
      create: {
        source,
        repository,
        status,
        lastSyncAt: new Date(),
        errorMessage,
      },
      update: {
        status,
        lastSyncAt: new Date(),
        errorMessage,
      },
    });
  },

  // Semantic Search (requires embeddings)
  async semanticSearch(queryEmbedding: number[], limit = 10, threshold = 0.7) {
    // Using the match_documents function from Supabase
    return prisma.$queryRaw`
      SELECT * FROM vault.match_documents(
        ${JSON.stringify(queryEmbedding)}::vector,
        ${threshold},
        ${limit}
      )
    `;
  },
};

export default vault;
