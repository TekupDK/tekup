import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const PeriodFilterSchema = z.enum(['24h', '7d', '30d', '90d']);
type PeriodFilter = z.infer<typeof PeriodFilterSchema>;

export function getRevenue(req: Request, res: Response, next: NextFunction): void {
  try {
    const period = PeriodFilterSchema.parse(req.query.period || '7d');
    const revenueData = generateRevenueData(period);
    res.json(revenueData);
  } catch (error) {
    next(error);
  }
}

export function getServiceDistribution(_req: Request, res: Response): void {
  // Rendetalje.dk's actual service categories
  const serviceDistribution = [
    { name: 'Privatrengøring', value: 145, color: '#00d4ff' },
    { name: 'Flytterengøring', value: 87, color: '#00ff88' },
    { name: 'Hovedrengøring', value: 62, color: '#ffd93d' },
    { name: 'Erhverv', value: 34, color: '#ff0066' },
    { name: 'Airbnb', value: 28, color: '#9333ea' },
    { name: 'Vinduer', value: 18, color: '#00a8ff' },
  ];
  res.json(serviceDistribution);
}

function generateRevenueData(period: PeriodFilter): Array<{ date: string; revenue: number }> {
  const data: Array<{ date: string; revenue: number }> = [];
  const now = new Date();
  if (period === '24h') {
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({ date: hour.getHours() + ':00', revenue: Math.floor(Math.random() * 5000) + 2000 });
    }
  } else if (period === '7d') {
    const days = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      data.push({ date: days[day.getDay()], revenue: Math.floor(Math.random() * 25000) + 15000 });
    }
  } else if (period === '30d') {
    for (let i = 4; i >= 0; i--) {
      data.push({ date: 'Uge ' + (5 - i), revenue: Math.floor(Math.random() * 80000) + 50000 });
    }
  } else if (period === '90d') {
    const months = ['Juli', 'August', 'September'];
    for (let i = 0; i < 3; i++) {
      data.push({ date: months[i], revenue: Math.floor(Math.random() * 200000) + 150000 });
    }
  }
  return data;
}
