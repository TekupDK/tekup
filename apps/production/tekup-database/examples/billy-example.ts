/**
 * Example usage of Billy client
 */

import { billy } from '../src/client/billy';

async function example() {
  // Create organization
  const org = await billy.createOrganization({
    name: 'Example Company',
    billyApiKey: 'encrypted_key_here',
    billyOrgId: 'billy-org-123',
    settings: { cacheEnabled: true },
  });

  console.log('Created organization:', org.id);

  // Cache an invoice
  await billy.setCachedInvoice(
    org.id,
    'inv-123',
    { invoiceNumber: '2025-001', total: 1000 },
    60 // TTL in minutes
  );

  // Retrieve cached invoice
  const cached = await billy.getCachedInvoice(org.id, 'inv-123');
  console.log('Cached invoice:', cached?.data);

  // Log audit trail
  await billy.logAudit({
    organizationId: org.id,
    toolName: 'list_invoices',
    action: 'read',
    resourceType: 'invoice',
    success: true,
    durationMs: 250,
  });

  // Track usage
  await billy.trackUsage(org.id, 'list_invoices', true, 250);

  console.log('Audit logged and usage tracked');
}

example().catch(console.error);
