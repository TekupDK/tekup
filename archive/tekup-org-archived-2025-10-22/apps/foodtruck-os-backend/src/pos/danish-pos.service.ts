import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createLogger } from '@tekup/shared';

const logger = createLogger('danish-pos');

@Injectable()
export class DanishPOSService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Process sale with Danish VAT compliance (25%)
   */
  async processSale(saleRequest: SaleRequest): Promise<SaleResult> {
    try {
      const { truckId, items, customerId, paymentMethod } = saleRequest;

      // Calculate Danish VAT (25%)
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const vatAmount = subtotal * 0.25;
      const totalAmount = subtotal + vatAmount;

      // Generate Danish receipt number (format: YYYY-NNNNNN)
      const receiptNumber = await this.generateDanishReceiptNumber(truckId);

      // Create sale record
      const sale = await this.prisma.sale.create({
        data: {
          truckId,
          receiptNumber,
          subtotal,
          vatAmount,
          totalAmount,
          paymentMethod,
          customerId,
          items: items.map(item => ({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            vatRate: 0.25,
            subtotal: item.price * item.quantity,
            vatAmount: (item.price * item.quantity) * 0.25
          })),
          saleDate: new Date(),
          status: 'COMPLETED'
        }
      });

      // Update inventory
      for (const item of items) {
        await this.updateInventoryAfterSale(truckId, item.menuItemId, item.quantity);
      }

      // Process Danish payment integration
      const paymentResult = await this.processDanishPayment(totalAmount, paymentMethod, customerId);

      // Generate Danish-compliant receipt
      const receipt = await this.generateDanishReceipt(sale, paymentResult);

      logger.info(`Sale processed: ${receiptNumber} - ${totalAmount} DKK (VAT: ${vatAmount} DKK)`);

      return {
        saleId: sale.id,
        receiptNumber,
        subtotal,
        vatAmount,
        totalAmount,
        paymentStatus: paymentResult.status,
        receipt,
        timestamp: sale.saleDate
      };

    } catch (error) {
      logger.error('Sale processing failed:', error);
      throw new Error(`Sale processing failed: ${error.message}`);
    }
  }

  /**
   * Process Danish payment methods (Dankort, MobilePay, Cash)
   */
  async processDanishPayment(amount: number, method: PaymentMethod, customerId?: string): Promise<PaymentResult> {
    try {
      switch (method) {
        case 'DANKORT':
          return await this.processDankortPayment(amount);
        
        case 'MOBILEPAY':
          return await this.processMobilePayPayment(amount, customerId);
        
        case 'CASH':
          return { status: 'SUCCESS', transactionId: `CASH-${Date.now()}` };
        
        case 'CREDIT_CARD':
          return await this.processCreditCardPayment(amount);
        
        default:
          throw new Error(`Unsupported payment method: ${method}`);
      }
    } catch (error) {
      logger.error(`Payment processing failed for ${method}:`, error);
      return { status: 'FAILED', error: error.message };
    }
  }

  /**
   * Generate Danish-compliant receipt
   */
  async generateDanishReceipt(sale: any, paymentResult: PaymentResult): Promise<DanishReceipt> {
    const truck = await this.prisma.foodTruck.findUnique({
      where: { id: sale.truckId },
      include: { owner: true }
    });

    const receipt: DanishReceipt = {
      // Header - Business information
      businessInfo: {
        name: truck.businessName,
        cvr: truck.owner.cvr,
        address: truck.baseAddress,
        phone: truck.contactPhone,
        email: truck.contactEmail
      },
      
      // Receipt details
      receiptNumber: sale.receiptNumber,
      date: sale.saleDate,
      cashier: 'Food Truck Operator',
      
      // Items with VAT breakdown
      items: sale.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.subtotal,
        vatRate: '25%',
        vatAmount: item.vatAmount,
        total: item.subtotal + item.vatAmount
      })),
      
      // Totals
      subtotal: sale.subtotal,
      totalVAT: sale.vatAmount,
      totalAmount: sale.totalAmount,
      
      // Payment information
      paymentMethod: sale.paymentMethod,
      paymentStatus: paymentResult.status,
      transactionId: paymentResult.transactionId,
      
      // Legal footer (Danish requirements)
      legalFooter: {
        vatNotice: 'Moms er inkluderet i prisen i henhold til dansk lovgivning',
        businessRegistration: `CVR: ${truck.owner.cvr}`,
        receiptCopyInfo: 'Kopi af kvittering kan fås på email ved henvendelse',
        returnPolicy: 'Returnering efter aftale - kontakt ved problemer'
      },
      
      // QR code for digital receipt
      digitalReceiptQR: `https://receipts.tekup.dk/${sale.receiptNumber}`
    };

    return receipt;
  }

  /**
   * Generate daily sales report with Danish tax information
   */
  async generateDailySalesReport(truckId: string, date: Date): Promise<DailySalesReport> {
    const startDate = new Date(date.setHours(0, 0, 0, 0));
    const endDate = new Date(date.setHours(23, 59, 59, 999));

    const sales = await this.prisma.sale.findMany({
      where: {
        truckId,
        saleDate: { gte: startDate, lte: endDate },
        status: 'COMPLETED'
      }
    });

    const paymentBreakdown = this.calculatePaymentBreakdown(sales);
    const vatBreakdown = this.calculateVATBreakdown(sales);

    const report: DailySalesReport = {
      truckId,
      reportDate: date,
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      totalVAT: sales.reduce((sum, sale) => sum + sale.vatAmount, 0),
      netRevenue: sales.reduce((sum, sale) => sum + sale.subtotal, 0),
      paymentBreakdown,
      vatBreakdown,
      hourlyBreakdown: this.calculateHourlyBreakdown(sales),
      topItems: await this.calculateTopSellingItems(sales),
      averageTransactionValue: sales.length > 0 ? 
        sales.reduce((sum, sale) => sum + sale.totalAmount, 0) / sales.length : 0
    };

    // Store report for tax compliance
    await this.prisma.dailySalesReport.create({
      data: report
    });

    logger.info(`Daily sales report generated for truck ${truckId}: ${report.totalRevenue} DKK revenue`);
    
    return report;
  }

  /**
   * Process refund with Danish VAT reversal
   */
  async processRefund(saleId: string, reason: string): Promise<RefundResult> {
    try {
      const sale = await this.prisma.sale.findUnique({
        where: { id: saleId }
      });

      if (!sale) {
        throw new Error('Sale not found');
      }

      // Create refund record
      const refund = await this.prisma.refund.create({
        data: {
          originalSaleId: saleId,
          refundAmount: sale.totalAmount,
          vatRefund: sale.vatAmount,
          reason,
          refundDate: new Date(),
          status: 'PROCESSED'
        }
      });

      // Reverse inventory changes
      for (const item of sale.items) {
        await this.reverseInventoryChange(sale.truckId, item.menuItemId, item.quantity);
      }

      logger.info(`Refund processed: ${sale.receiptNumber} - ${sale.totalAmount} DKK`);

      return {
        refundId: refund.id,
        originalReceiptNumber: sale.receiptNumber,
        refundAmount: refund.refundAmount,
        vatRefund: refund.vatRefund,
        status: 'SUCCESS'
      };

    } catch (error) {
      logger.error('Refund processing failed:', error);
      throw new Error(`Refund failed: ${error.message}`);
    }
  }

  // Private methods
  private async generateDanishReceiptNumber(truckId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.sale.count({
      where: {
        truckId,
        saleDate: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
        }
      }
    });

    return `${year}-${(count + 1).toString().padStart(6, '0')}`;
  }

  private async processDankortPayment(amount: number): Promise<PaymentResult> {
    // Integration with Danish Dankort payment system
    // This would integrate with actual Dankort APIs in production
    
    return {
      status: 'SUCCESS',
      transactionId: `DK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fees: amount * 0.0075 // 0.75% Dankort fee
    };
  }

  private async processMobilePayPayment(amount: number, customerId?: string): Promise<PaymentResult> {
    // Integration with MobilePay APIs
    
    return {
      status: 'SUCCESS',
      transactionId: `MP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fees: amount * 0.01 // 1% MobilePay fee
    };
  }

  private async processCreditCardPayment(amount: number): Promise<PaymentResult> {
    // Integration with credit card processors
    
    return {
      status: 'SUCCESS',
      transactionId: `CC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fees: amount * 0.015 // 1.5% credit card fee
    };
  }

  private async updateInventoryAfterSale(truckId: string, menuItemId: string, quantity: number): Promise<void> {
    // Update inventory levels after sale
    await this.prisma.inventoryItem.updateMany({
      where: {
        truckId,
        menuItemId
      },
      data: {
        currentStock: { decrement: quantity }
      }
    });
  }

  private async reverseInventoryChange(truckId: string, menuItemId: string, quantity: number): Promise<void> {
    // Reverse inventory changes for refunds
    await this.prisma.inventoryItem.updateMany({
      where: {
        truckId,
        menuItemId
      },
      data: {
        currentStock: { increment: quantity }
      }
    });
  }

  private calculatePaymentBreakdown(sales: any[]): PaymentBreakdown {
    const breakdown: PaymentBreakdown = {
      cash: { count: 0, amount: 0 },
      dankort: { count: 0, amount: 0 },
      mobilepay: { count: 0, amount: 0 },
      creditCard: { count: 0, amount: 0 }
    };

    sales.forEach(sale => {
      switch (sale.paymentMethod) {
        case 'CASH':
          breakdown.cash.count++;
          breakdown.cash.amount += sale.totalAmount;
          break;
        case 'DANKORT':
          breakdown.dankort.count++;
          breakdown.dankort.amount += sale.totalAmount;
          break;
        case 'MOBILEPAY':
          breakdown.mobilepay.count++;
          breakdown.mobilepay.amount += sale.totalAmount;
          break;
        case 'CREDIT_CARD':
          breakdown.creditCard.count++;
          breakdown.creditCard.amount += sale.totalAmount;
          break;
      }
    });

    return breakdown;
  }

  private calculateVATBreakdown(sales: any[]): VATBreakdown {
    return {
      vatRate25: {
        netAmount: sales.reduce((sum, sale) => sum + sale.subtotal, 0),
        vatAmount: sales.reduce((sum, sale) => sum + sale.vatAmount, 0),
        totalAmount: sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
      }
    };
  }

  private calculateHourlyBreakdown(sales: any[]): Array<{ hour: number; sales: number; revenue: number }> {
    const hourlyData = new Array(24).fill(0).map((_, i) => ({ hour: i, sales: 0, revenue: 0 }));
    
    sales.forEach(sale => {
      const hour = sale.saleDate.getHours();
      hourlyData[hour].sales++;
      hourlyData[hour].revenue += sale.totalAmount;
    });

    return hourlyData.filter(data => data.sales > 0);
  }

  private async calculateTopSellingItems(sales: any[]): Promise<Array<{ name: string; quantity: number; revenue: number }>> {
    const itemStats = new Map();
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const existing = itemStats.get(item.name) || { name: item.name, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += item.subtotal + item.vatAmount;
        itemStats.set(item.name, existing);
      });
    });

    return Array.from(itemStats.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }
}

// Types
export interface SaleRequest {
  truckId: string;
  items: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  customerId?: string;
  paymentMethod: PaymentMethod;
}

export type PaymentMethod = 'CASH' | 'DANKORT' | 'MOBILEPAY' | 'CREDIT_CARD';

export interface SaleResult {
  saleId: string;
  receiptNumber: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  paymentStatus: string;
  receipt: DanishReceipt;
  timestamp: Date;
}

export interface PaymentResult {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  transactionId?: string;
  fees?: number;
  error?: string;
}

export interface DanishReceipt {
  businessInfo: {
    name: string;
    cvr: string;
    address: string;
    phone: string;
    email: string;
  };
  receiptNumber: string;
  date: Date;
  cashier: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    vatRate: string;
    vatAmount: number;
    total: number;
  }>;
  subtotal: number;
  totalVAT: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionId?: string;
  legalFooter: {
    vatNotice: string;
    businessRegistration: string;
    receiptCopyInfo: string;
    returnPolicy: string;
  };
  digitalReceiptQR: string;
}

export interface DailySalesReport {
  truckId: string;
  reportDate: Date;
  totalSales: number;
  totalRevenue: number;
  totalVAT: number;
  netRevenue: number;
  paymentBreakdown: PaymentBreakdown;
  vatBreakdown: VATBreakdown;
  hourlyBreakdown: Array<{ hour: number; sales: number; revenue: number }>;
  topItems: Array<{ name: string; quantity: number; revenue: number }>;
  averageTransactionValue: number;
}

export interface PaymentBreakdown {
  cash: { count: number; amount: number };
  dankort: { count: number; amount: number };
  mobilepay: { count: number; amount: number };
  creditCard: { count: number; amount: number };
}

export interface VATBreakdown {
  vatRate25: {
    netAmount: number;
    vatAmount: number;
    totalAmount: number;
  };
}

export interface RefundResult {
  refundId: string;
  originalReceiptNumber: string;
  refundAmount: number;
  vatRefund: number;
  status: string;
}
