import { Injectable, Logger } from '@nestjs/common';
import { BusinessConfig } from '../../business-config/entities/business-config.entity';

export interface OrderItem {
  name: string;
  quantity: number;
  size?: string;
  modifications?: string[];
  price?: number;
}

export interface OrderResult {
  success: boolean;
  message: string;
  data?: {
    orderId: string;
    items: OrderItem[];
    totalPrice: number;
    estimatedTime: number;
  };
}

@Injectable()
export class OrderFoodHandler {
  private readonly logger = new Logger(OrderFoodHandler.name);

  async execute(
    parameters: Record<string, any>,
    businessConfig: BusinessConfig
  ): Promise<OrderResult> {
    
    try {
      this.logger.log(`Processing food order: ${JSON.stringify(parameters)}`);

      // Extract order details from voice parameters
      const orderItems = this.extractOrderItems(parameters);
      
      // Validate against menu (if integration available)
      const validatedItems = await this.validateMenuItems(orderItems, businessConfig);
      
      // Calculate pricing
      const totalPrice = this.calculateTotalPrice(validatedItems);
      
      // Submit order to POS system (if integrated)
      const orderId = await this.submitOrder(validatedItems, businessConfig);
      
      // Generate confirmation message in Danish
      const confirmationMessage = this.generateConfirmationMessage(validatedItems, totalPrice);

      return {
        success: true,
        message: confirmationMessage,
        data: {
          orderId,
          items: validatedItems,
          totalPrice,
          estimatedTime: this.calculateEstimatedTime(validatedItems)
        }
      };

    } catch (error) {
      this.logger.error(`Order processing failed: ${error.message}`);
      return {
        success: false,
        message: 'Undskyld, jeg kunne ikke behandle din ordre. Prøv igen eller tal med personalet.'
      };
    }
  }

  private extractOrderItems(parameters: Record<string, any>): OrderItem[] {
    // Extract items from AI-parsed parameters
    const items: OrderItem[] = [];
    
    if (parameters.items && Array.isArray(parameters.items)) {
      for (const item of parameters.items) {
        items.push({
          name: item.name || item.product,
          quantity: parseInt(item.quantity) || 1,
          size: item.size,
          modifications: item.modifications || [],
        });
      }
    } else if (parameters.product || parameters.item) {
      // Single item order
      items.push({
        name: parameters.product || parameters.item,
        quantity: parseInt(parameters.quantity) || 1,
        size: parameters.size,
        modifications: parameters.modifications ? [parameters.modifications] : [],
      });
    }

    return items;
  }

  private async validateMenuItems(
    items: OrderItem[], 
    businessConfig: BusinessConfig
  ): Promise<OrderItem[]> {
    
    // Check if menu integration is available
    const menuIntegration = businessConfig.integrations.find(
      integration => integration.type === 'menu-system'
    );

    if (!menuIntegration) {
      // No menu validation - return items as-is with default pricing
      return items.map(item => ({
        ...item,
        price: this.getDefaultPrice(item.name, item.size)
      }));
    }

    // TODO: Implement actual menu system integration
    // For now, simulate menu validation
    return items.map(item => ({
      ...item,
      price: this.getDefaultPrice(item.name, item.size)
    }));
  }

  private getDefaultPrice(itemName: string, size?: string): number {
    // Simple pricing logic - replace with actual menu integration
    const basePrices = {
      'pizza': 89,
      'burger': 79, 
      'sandwich': 49,
      'kaffe': 25,
      'øl': 35,
      'vand': 15,
    };

    const sizeMultipliers = {
      'lille': 0.8,
      'mellem': 1.0,
      'stor': 1.3,
      'extra': 1.5,
    };

    const basePrice = basePrices[itemName.toLowerCase()] || 50;
    const sizeMultiplier = size ? sizeMultipliers[size.toLowerCase()] || 1.0 : 1.0;
    
    return Math.round(basePrice * sizeMultiplier);
  }

  private calculateTotalPrice(items: OrderItem[]): number {
    return items.reduce((total, item) => {
      return total + (item.price || 0) * item.quantity;
    }, 0);
  }

  private async submitOrder(
    items: OrderItem[],
    businessConfig: BusinessConfig
  ): Promise<string> {
    
    // Check for POS system integration
    const posIntegration = businessConfig.integrations.find(
      integration => integration.type === 'pos-system'
    );

    if (posIntegration) {
      // TODO: Implement actual POS integration
      this.logger.log('Submitting order to POS system');
      // return await this.posSystemClient.createOrder(items);
    }

    // Generate order ID for tracking
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    this.logger.log(`Generated order ID: ${orderId}`);
    
    return orderId;
  }

  private generateConfirmationMessage(items: OrderItem[], totalPrice: number): string {
    const itemDescriptions = items.map(item => {
      let description = `${item.quantity}x ${item.name}`;
      if (item.size) description += ` (${item.size})`;
      if (item.modifications && item.modifications.length > 0) {
        description += ` med ${item.modifications.join(', ')}`;
      }
      return description;
    });

    return `Tak for din ordre! ${itemDescriptions.join(', ')}. Total pris: ${totalPrice} kr. Din ordre er nu i køen.`;
  }

  private calculateEstimatedTime(items: OrderItem[]): number {
    // Simple estimation logic - replace with actual kitchen integration
    const baseTime = 5; // 5 minutes base
    const itemTime = items.reduce((time, item) => {
      const itemComplexity = this.getItemComplexity(item.name);
      return time + (itemComplexity * item.quantity);
    }, 0);

    return Math.max(baseTime, Math.round(itemTime));
  }

  private getItemComplexity(itemName: string): number {
    // Time complexity in minutes per item
    const complexities = {
      'pizza': 8,
      'burger': 6,
      'sandwich': 3,
      'kaffe': 1,
      'øl': 0.5,
      'vand': 0.5,
    };

    return complexities[itemName.toLowerCase()] || 5;
  }
}