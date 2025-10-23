/**
 * Customer management tools for Billy.dk MCP server
 * Implements list, create, and get customer functionality
 */

import { z } from 'zod';
import { log } from '../utils/logger.js';
import { BillyClient } from '../billy-client.js';
import { dataLogger } from '../utils/data-logger.js';
import { extractBillyErrorMessage } from '../utils/error-handler.js';

// Input schemas for validation
const listCustomersSchema = z.object({
  search: z.string().optional().describe('Search term to filter customers by name'),
});

const createCustomerSchema = z.object({
  name: z.string().describe('Customer name'),
  email: z.string().email().optional().describe('Customer email address (Billy API limitation: OAuth tokens do not support email/phone)'),
  phone: z.string().optional().describe('Customer phone number (Billy API limitation: OAuth tokens do not support email/phone)'),
  address: z.object({
    street: z.string().describe('Street address'),
    zipcode: z.string().describe('Zip code'),
    city: z.string().describe('City'),
    country: z.string().optional().describe('Country code (default: DK)'),
  }).optional().describe('Customer address'),
});

const getCustomerSchema = z.object({
  contactId: z.string().describe('Customer contact ID to retrieve'),
});

/**
 * List customers with optional search filtering
 */
export async function listCustomers(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const params = listCustomersSchema.parse(args);

    // Log the action
    await dataLogger.logAction({
      action: 'listCustomers',
      tool: 'customers',
      parameters: params,
    });

    const contacts = await client.getContacts('customer', params.search);

    // Add null checks
    if (!contacts || !Array.isArray(contacts)) {
      log.error('Invalid contacts response from Billy API', null, { contacts });
      throw new Error('Invalid response format from Billy API - expected array of contacts');
    }

    const customerList = contacts.map(contact => ({
      id: contact.id,
      contactNo: contact.contactNo,
      name: contact.name,
      street: contact.street,
      zipcode: contact.zipcode,
      city: contact.city,
      countryId: contact.countryId,
      phone: contact.phone,
      contactPersons: (contact.contactPersons || []).map(person => ({
        name: person.name,
        email: person.email,
      })),
    }));

    // Log successful completion
    await dataLogger.logAction({
      action: 'listCustomers',
      tool: 'customers',
      parameters: params,
      result: 'success',
      metadata: {
        executionTime: Date.now() - startTime,
        dataSize: customerList.length,
      },
    });

    const responseData = {
      success: true,
      customers: customerList,
      count: customerList.length,
    };

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(responseData, null, 2),
      }],
      structuredContent: responseData
    };
  } catch (error: any) {
    const errorMessage = extractBillyErrorMessage(error);
    
    await dataLogger.logAction({
      action: 'listCustomers',
      tool: 'customers',
      parameters: args,
      result: 'error',
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage: errorMessage,
      },
    });

    return {
      content: [{
        type: 'text' as const,
        text: `Error listing customers: ${errorMessage}`,
      }],
      isError: true,
    };
  }
}

/**
 * Create a new customer
 */
export async function createCustomer(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const customerData = createCustomerSchema.parse(args);

    // Log the action
    await dataLogger.logAction({
      action: 'createCustomer',
      tool: 'customers',
      parameters: customerData,
    });

    const contact = await client.createContact(customerData);

    // Add null checks
    if (!contact) {
      log.error('Invalid contact creation response from Billy API', null, { contact });
      throw new Error('Failed to create customer - invalid response from Billy API');
    }

    // NEW: If email or phone was provided, update the contact immediately
    // Billy API doesn't support email/phone on CREATE, but DOES support it on UPDATE
    if (customerData.email || customerData.phone) {
      try {
        log.info('Updating contact with email/phone', { contactId: contact.id });
        
        // IMPORTANT: Send both email AND phone in ONE update call
        // Billy API might overwrite contactPersons array if we do separate calls
        const updatePayload: any = {
          name: contact.name
        };
        
        if (customerData.phone) {
          updatePayload.phone = customerData.phone;
        }
        
        if (customerData.email) {
          updatePayload.email = customerData.email;
        }
        
        const updatedContact = await client.updateContact(contact.id, updatePayload);
        Object.assign(contact, updatedContact);
        
        log.info('Contact updated successfully', {
          id: contact.id,
          hasPhone: !!contact.phone,
          hasEmail: !!contact.contactPersons?.length
        });
        
      } catch (updateError) {
        log.warn('Failed to update contact with email/phone', {
          error: updateError instanceof Error ? updateError.message : String(updateError)
        });
        // Continue anyway - contact was created successfully, just without email/phone
      }
    }

    // Log successful completion
    await dataLogger.logAction({
      action: 'createCustomer',
      tool: 'customers',
      parameters: customerData,
      result: 'success',
      metadata: {
        executionTime: Date.now() - startTime,
      },
    });

    // Build message based on whether email/phone was successfully saved
    let message = 'Customer created successfully';
    if (customerData.email || customerData.phone) {
      if (contact.contactPersons?.length || contact.phone) {
        message += ' with email and phone contact information';
      } else {
        message += ' (Note: Email/phone could not be saved - Billy API limitation)';
      }
    }

    const responseData = {
      success: true,
      message,
      customer: {
        id: contact.id,
        contactNo: contact.contactNo,
        name: contact.name,
        type: contact.type,
        street: contact.street,
        zipcode: contact.zipcode,
        city: contact.city,
        countryId: contact.countryId,
        phone: contact.phone,
        contactPersons: contact.contactPersons || [],
      },
    };

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(responseData, null, 2),
      }],
      structuredContent: responseData
    };
  } catch (error: any) {
    const errorMessage = extractBillyErrorMessage(error);
    
    log.error('createCustomer error', error, {
      userMessage: errorMessage,
      billyError: error.billyDetails?.billyErrorMessage,
      billyErrorCode: error.billyDetails?.billyErrorCode,
      validationErrors: error.billyDetails?.validationErrors,
      originalMessage: error.message,
    });
    
    await dataLogger.logAction({
      action: 'createCustomer',
      tool: 'customers',
      parameters: args,
      result: 'error',
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage: errorMessage,
      },
    });

    return {
      content: [{
        type: 'text' as const,
        text: `Error creating customer: ${errorMessage}`,
      }],
      isError: true,
    };
  }
}

/**
 * Get detailed information about a specific customer
 */
export async function getCustomer(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const { contactId } = getCustomerSchema.parse(args);

    // Log the action
    await dataLogger.logAction({
      action: 'getCustomer',
      tool: 'customers',
      parameters: { contactId },
    });

    const contact = await client.getContact(contactId);

    // Add null checks
    if (!contact) {
      log.error('Invalid contact response from Billy API', null, { contact });
      throw new Error('Contact not found or invalid response from Billy API');
    }

    // Log successful completion
    await dataLogger.logAction({
      action: 'getCustomer',
      tool: 'customers',
      parameters: { contactId },
      result: 'success',
      metadata: {
        executionTime: Date.now() - startTime,
      },
    });

    const responseData = {
      success: true,
      customer: {
        id: contact.id,
        contactNo: contact.contactNo,
        type: contact.type,
        name: contact.name,
        street: contact.street,
        zipcode: contact.zipcode,
        city: contact.city,
        countryId: contact.countryId,
        phone: contact.phone,
        contactPersons: (contact.contactPersons || []).map(person => ({
          name: person.name,
          email: person.email,
          phone: person.phone,
        })),
        organizationId: contact.organizationId,
      },
    };

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(responseData, null, 2),
      }],
      structuredContent: responseData
    };
  } catch (error: any) {
    const errorMessage = extractBillyErrorMessage(error);
    
    await dataLogger.logAction({
      action: 'getCustomer',
      tool: 'customers',
      parameters: args,
      result: 'error',
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage: errorMessage,
      },
    });

    return {
      content: [{
        type: 'text' as const,
        text: `Error retrieving customer: ${errorMessage}`,
      }],
      isError: true,
    };
  }
}

// Sprint 1: Update customer tool

const updateCustomerSchema = z.object({
  contactId: z.string().describe('Customer contact ID to update'),
  name: z.string().optional().describe('Customer name'),
  email: z.string().email().optional().describe('Customer email address'),
  phone: z.string().optional().describe('Customer phone number'),
  address: z.object({
    street: z.string().optional().describe('Street address'),
    zipcode: z.string().optional().describe('Zip code'),
    city: z.string().optional().describe('City'),
    country: z.string().optional().describe('Country code'),
  }).optional().describe('Customer address'),
});

/**
 * Update an existing customer
 */
export async function updateCustomer(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const { contactId, ...updateData } = updateCustomerSchema.parse(args);

    await dataLogger.logAction({
      action: 'updateCustomer',
      tool: 'customers',
      parameters: { contactId, updateData },
    });

    const contact = await client.updateContact(contactId, updateData);

    await dataLogger.logAction({
      action: 'updateCustomer',
      tool: 'customers',
      parameters: { contactId, updateData },
      result: 'success',
      metadata: {
        executionTime: Date.now() - startTime,
      },
    });

    const responseData = {
      success: true,
      message: 'Customer updated successfully',
      customer: {
        id: contact.id,
        contactNo: contact.contactNo,
        name: contact.name,
        type: contact.type,
        street: contact.street,
        zipcode: contact.zipcode,
        city: contact.city,
        countryId: contact.countryId,
        phone: contact.phone,
        contactPersons: contact.contactPersons,
      },
    };

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(responseData, null, 2),
      }],
      structuredContent: responseData
    };
  } catch (error: any) {
    const errorMessage = extractBillyErrorMessage(error);
    
    await dataLogger.logAction({
      action: 'updateCustomer',
      tool: 'customers',
      parameters: args,
      result: 'error',
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage: errorMessage,
      },
    });

    return {
      content: [{
        type: 'text' as const,
        text: `Error updating customer: ${errorMessage}`,
      }],
      isError: true,
    };
  }
}