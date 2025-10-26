export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  allergens: string[];
  ingredients: string[];
  available: boolean;
}

export interface SaleItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export type PaymentMethod = 'DANKORT' | 'MOBILEPAY' | 'CASH';

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  vatAmount: number;
  paymentMethod: PaymentMethod;
  timestamp: Date;
  receiptNumber: string;
}

export interface ComplianceReport {
  id: string;
  type: 'TEMPERATURE' | 'HACCP' | 'CLEANING' | 'SAFETY';
  status: 'COMPLIANT' | 'WARNING' | 'VIOLATION';
  description: string;
  timestamp: Date;
  actionRequired?: string;
}

export interface TemperatureLog {
  id: string;
  location: string;
  temperature: number;
  timestamp: Date;
  compliant: boolean;
}
