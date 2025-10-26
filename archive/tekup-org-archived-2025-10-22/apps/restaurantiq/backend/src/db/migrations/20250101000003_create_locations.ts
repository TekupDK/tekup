/**
 * Migration: Create Locations Table
 * Creates the locations/restaurants table for multi-location support
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('locations', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Tenant relationship
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    
    // Basic location info
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.string('location_code', 50).nullable(); // Internal code/identifier
    table.string('phone', 20).nullable();
    table.string('email', 255).nullable();
    table.string('website', 255).nullable();
    
    // Address
    table.string('address_street', 255).notNullable();
    table.string('address_city', 100).notNullable();
    table.string('address_postal_code', 10).notNullable();
    table.string('address_region', 100).nullable();
    table.string('address_country', 2).defaultTo('DK');
    table.decimal('latitude', 10, 8).nullable();
    table.decimal('longitude', 11, 8).nullable();
    
    // Operating details
    table.jsonb('business_hours').nullable(); // Week schedule
    table.jsonb('holiday_hours').nullable(); // Special hours for holidays
    table.integer('max_capacity').nullable(); // Maximum customers
    table.integer('table_count').nullable();
    table.integer('kitchen_capacity').nullable(); // Orders per hour
    table.decimal('floor_area_sqm', 10, 2).nullable(); // Square meters
    
    // Restaurant specific settings
    table.string('cuisine_type', 100).nullable(); // Italian, Danish, Asian, etc.
    table.jsonb('service_types').defaultTo('["dine_in"]'); // dine_in, takeaway, delivery
    table.boolean('accepts_reservations').defaultTo(true);
    table.boolean('has_bar').defaultTo(false);
    table.boolean('has_outdoor_seating').defaultTo(false);
    table.boolean('wheelchair_accessible').defaultTo(false);
    table.boolean('has_parking').defaultTo(false);
    
    // Danish specific compliance
    table.string('food_authority_id', 50).nullable(); // Fødevarestyrelsen ID
    table.string('liquor_license_number', 50).nullable();
    table.date('liquor_license_expires').nullable();
    table.jsonb('health_permits').nullable(); // Various health and safety permits
    
    // POS Integration
    table.jsonb('pos_settings').nullable(); // POS system configuration
    table.string('pos_system_type', 50).nullable(); // lightspeed, toast, etc.
    table.boolean('pos_integration_enabled').defaultTo(false);
    table.timestamp('last_pos_sync').nullable();
    
    // Payment settings
    table.jsonb('payment_methods').defaultTo(JSON.stringify([
      'cash', 'card', 'mobilepay', 'apple_pay', 'google_pay'
    ]));
    table.string('merchant_id', 100).nullable();
    table.jsonb('payment_provider_settings').nullable();
    
    // Operational preferences
    table.decimal('default_tax_rate', 5, 4).defaultTo(0.25); // Danish MOMS 25%
    table.string('currency', 3).defaultTo('DKK');
    table.string('timezone', 50).defaultTo('Europe/Copenhagen');
    table.boolean('auto_ordering_enabled').defaultTo(false);
    table.boolean('waste_tracking_enabled').defaultTo(true);
    table.boolean('staff_optimization_enabled').defaultTo(true);
    table.boolean('real_time_updates_enabled').defaultTo(true);
    
    // Analytics and reporting
    table.jsonb('kpi_targets').nullable(); // Revenue, cost, efficiency targets
    table.jsonb('reporting_preferences').nullable();
    table.boolean('ai_forecasting_enabled').defaultTo(true);
    
    // Images and branding
    table.string('logo_url', 500).nullable();
    table.jsonb('image_urls').nullable(); // Interior, exterior, food photos
    table.jsonb('social_media_links').nullable();
    
    // Status and operational state
    table.enum('status', ['active', 'inactive', 'temporarily_closed', 'under_renovation']).defaultTo('active');
    table.boolean('currently_open').defaultTo(false); // Real-time open/closed status
    table.text('closure_reason').nullable();
    table.timestamp('reopening_date').nullable();
    
    // Manager assignment
    table.uuid('manager_id').nullable().references('id').inTable('users');
    
    // Audit fields
    table.timestamps(true, true);
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();
    
    // Indexes
    table.index(['tenant_id']);
    table.index(['status']);
    table.index(['manager_id']);
    table.index(['location_code']);
    table.index(['address_postal_code']);
    table.unique(['tenant_id', 'location_code']); // Code unique per tenant
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('locations');
}
