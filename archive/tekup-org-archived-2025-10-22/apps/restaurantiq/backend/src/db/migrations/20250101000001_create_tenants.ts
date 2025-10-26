/**
 * Migration: Create Tenants Table
 * Creates the base tenant table for multi-tenancy support
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('tenants', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Basic tenant info
    table.string('name', 255).notNullable();
    table.string('subdomain', 100).unique().notNullable();
    table.string('custom_domain', 255).nullable();
    
    // Danish business info
    table.string('cvr_number', 8).nullable().unique(); // Danish CVR number
    table.string('company_type', 50).nullable(); // ApS, A/S, etc.
    
    // Contact information
    table.string('email', 255).notNullable();
    table.string('phone', 20).nullable();
    table.string('website', 255).nullable();
    
    // Address
    table.string('address_street', 255).nullable();
    table.string('address_city', 100).nullable();
    table.string('address_postal_code', 10).nullable();
    table.string('address_region', 100).nullable();
    table.string('address_country', 2).defaultTo('DK');
    table.decimal('address_latitude', 10, 8).nullable();
    table.decimal('address_longitude', 11, 8).nullable();
    
    // Settings (JSON fields)
    table.jsonb('business_hours').nullable();
    table.jsonb('locale_settings').defaultTo(JSON.stringify({
      locale: 'da-DK',
      currency: 'DKK',
      timezone: 'Europe/Copenhagen'
    }));
    table.jsonb('feature_flags').defaultTo(JSON.stringify({
      ai_forecasting: true,
      advanced_scheduling: true,
      multi_location: false,
      pos_integration: true,
      accounting_integration: false,
      mobile_pay_integration: true,
      analytics_reporting: true,
      custom_branding: false
    }));
    table.jsonb('branding_settings').nullable();
    table.jsonb('billing_info').nullable();
    
    // Subscription and limits
    table.string('subscription_plan', 50).defaultTo('trial');
    table.timestamp('subscription_expires_at').nullable();
    table.integer('max_locations').defaultTo(1);
    table.integer('max_employees').defaultTo(10);
    table.bigInteger('max_storage_bytes').defaultTo(1073741824); // 1GB
    
    // Status and metadata
    table.enum('status', ['active', 'suspended', 'cancelled', 'trial']).defaultTo('trial');
    table.boolean('is_verified').defaultTo(false);
    table.timestamp('trial_ends_at').nullable();
    table.timestamp('last_activity_at').nullable();
    
    // Audit fields
    table.timestamps(true, true); // created_at, updated_at
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();
    
    // Indexes
    table.index(['status']);
    table.index(['subscription_plan']);
    table.index(['created_at']);
    table.index(['subdomain']);
    table.index(['cvr_number']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('tenants');
}
