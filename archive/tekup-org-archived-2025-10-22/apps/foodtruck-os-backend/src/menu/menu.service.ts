import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createLogger } from '@tekup/shared';

const logger = createLogger('menu-service');

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async createMenuItem(data: CreateMenuItemDto): Promise<any> {
    try {
      const menuItem = await this.prisma.menuItem.create({
        data: {
          truckId: data.truckId,
          name: data.name,
          description: data.description,
          price: data.price,
          category: data.category,
          allergens: data.allergens || [],
          ingredients: data.ingredients || [],
          available: true
        }
      });

      logger.info(`Menu item created: ${menuItem.id} - ${menuItem.name}`);
      return menuItem;
    } catch (error) {
      logger.error('Menu item creation failed:', error);
      throw error;
    }
  }

  async getMenuItems(truckId: string): Promise<any[]> {
    return this.prisma.menuItem.findMany({
      where: { truckId, available: true },
      orderBy: { category: 'asc' }
    });
  }

  async updateMenuItem(id: string, data: UpdateMenuItemDto): Promise<any> {
    return this.prisma.menuItem.update({
      where: { id },
      data
    });
  }

  async deleteMenuItem(id: string): Promise<void> {
    await this.prisma.menuItem.update({
      where: { id },
      data: { available: false }
    });
  }
}

export interface CreateMenuItemDto {
  truckId: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  allergens?: string[];
  ingredients?: string[];
}

export interface UpdateMenuItemDto {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  allergens?: string[];
  ingredients?: string[];
  available?: boolean;
}
