import axios from 'axios';
import { MenuItem, SaleItem, PaymentMethod } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('tekup_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const posApi = {
  getMenuItems: async (): Promise<MenuItem[]> => {
    const { data } = await apiClient.get('/menu/items');
    return data;
  },

  processSale: async (saleData: {
    items: SaleItem[];
    paymentMethod: PaymentMethod;
    totalAmount: number;
    vatAmount: number;
  }) => {
    const { data } = await apiClient.post('/pos/sales', saleData);
    return data;
  },

  getDailySales: async () => {
    const { data } = await apiClient.get('/pos/daily-sales');
    return data;
  },

  processRefund: async (saleId: string, reason: string) => {
    const { data } = await apiClient.post(`/pos/refunds`, { saleId, reason });
    return data;
  },
};

export const menuApi = {
  createMenuItem: async (itemData: Omit<MenuItem, 'id'>) => {
    const { data } = await apiClient.post('/menu/items', itemData);
    return data;
  },

  updateMenuItem: async (id: string, itemData: Partial<MenuItem>) => {
    const { data } = await apiClient.patch(`/menu/items/${id}`, itemData);
    return data;
  },

  deleteMenuItem: async (id: string) => {
    await apiClient.delete(`/menu/items/${id}`);
  },
};

export const complianceApi = {
  getComplianceReports: async () => {
    const { data } = await apiClient.get('/compliance/reports');
    return data;
  },

  logTemperature: async (tempData: {
    location: string;
    temperature: number;
    timestamp: Date;
  }) => {
    const { data } = await apiClient.post('/compliance/temperature-logs', tempData);
    return data;
  },

  generateHaccpPlan: async () => {
    const { data } = await apiClient.post('/compliance/haccp-plan');
    return data;
  },
};
