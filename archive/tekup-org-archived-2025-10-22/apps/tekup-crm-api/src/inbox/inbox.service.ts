import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);

  constructor(private prisma: PrismaService) {}

  async getContactActivitiesByEmail(email: string, tenantId: string) {
    try {
      // Find contact by email
      const contact = await this.prisma.Contact.findFirst({
        where: {
          email,
          tenantId,
        },
      });

      if (!contact) {
        return { activities: [] };
      }

      // Get activities related to this contact
      const activities = await this.prisma.Activity.findMany({
        where: {
          contacts: {
            some: {
              id: contact.id,
            },
          },
          tenantId,
        },
        include: {
          activityType: true,
        },
        orderBy: {
          scheduledAt: 'desc',
        },
      });

      return { contact, activities };
    } catch (error) {
      this.logger.error(`Failed to get contact activities: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getDealContextByEmail(email: string, tenantId: string) {
    try {
      // Find contact by email
      const contact = await this.prisma.Contact.findFirst({
        where: {
          email,
          tenantId,
        },
        include: {
          deals: true,
          company: true,
        },
      });

      if (!contact) {
        return { deals: [], company: null };
      }

      return { 
        deals: contact.deals, 
        company: contact.company,
        contact: {
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get deal context: ${error.message}`, error.stack);
      throw error;
    }
  }

  async linkActivityToEmail(activityId: string, email: string, tenantId: string) {
    try {
      // Find contact by email
      const contact = await this.prisma.Contact.findFirst({
        where: {
          email,
          tenantId,
        },
      });

      if (!contact) {
        // If contact doesn't exist, we can't link the activity
        return { success: false, message: 'Contact not found for this email' };
      }

      // Link activity to contact
      await this.prisma.Activity.update({
        where: {
          id: activityId,
          tenantId,
        },
        data: {
          contacts: {
            connect: {
              id: contact.id,
            },
          },
        },
      });

      return { success: true, message: 'Activity linked to contact' };
    } catch (error) {
      this.logger.error(`Failed to link activity to email: ${error.message}`, error.stack);
      throw error;
    }
  }
}