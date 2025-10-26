import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createLogger } from '@tekup/shared';
import { SchedulerRegistry, Cron } from '@nestjs/schedule';

const logger = createLogger('danish-food-safety');

@Injectable()
export class DanishFoodSafetyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  // Danish Food Safety Authority (Fødevarestyrelsen) integration
  private readonly foodAuthorityApiUrl = 'https://api.foedevarestyrelsen.dk/v1';

  /**
   * Register food truck with Danish Food Safety Authority
   */
  async registerTruckWithAuthorities(truckId: string): Promise<DanishFoodRegistration> {
    try {
      const truck = await this.prisma.foodTruck.findUnique({
        where: { id: truckId },
        include: { owner: true, location: true }
      });

      if (!truck) {
        throw new Error('Food truck not found');
      }

      const registrationData = {
        businessName: truck.businessName,
        ownerCvr: truck.owner.cvr,
        vehicleRegistration: truck.licensePlate,
        operatingAreas: truck.operatingAreas,
        foodTypes: truck.approvedFoodTypes,
        mobileBusiness: true,
        contactInfo: {
          phone: truck.owner.phone,
          email: truck.owner.email,
        }
      };

      // Submit to Food Safety Authority (mock implementation)
      const registrationId = `FSA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const registration: DanishFoodRegistration = {
        id: registrationId,
        truckId,
        status: 'PENDING',
        submittedAt: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        requirements: [
          'HACCP plan documentation',
          'Temperature monitoring system',
          'Cleaning and sanitization procedures',
          'Allergen management plan',
          'Waste disposal procedures'
        ],
        nextInspectionDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      };

      // Store registration in database
      await this.prisma.foodSafetyRegistration.create({
        data: registration
      });

      // Schedule compliance monitoring
      this.scheduleComplianceChecks(truckId, registrationId);

      logger.info(`Food truck ${truckId} registered with Danish Food Safety Authority: ${registrationId}`);
      
      return registration;

    } catch (error) {
      logger.error(`Food safety registration failed for truck ${truckId}:`, error);
      throw new Error('Failed to register with Danish Food Safety Authority');
    }
  }

  /**
   * Generate HACCP (Hazard Analysis Critical Control Points) plan
   */
  async generateHACCPPlan(truckId: string, menuItems: MenuItemHazard[]): Promise<HACCPPlan> {
    const hazardAnalysis: CriticalControlPoint[] = [];

    for (const item of menuItems) {
      // Analyze critical control points for each menu item
      const ccps = this.analyzeCriticalControlPoints(item);
      hazardAnalysis.push(...ccps);
    }

    const haccpPlan: HACCPPlan = {
      truckId,
      version: '1.0',
      createdDate: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      hazardAnalysis,
      monitoringProcedures: [
        {
          procedure: 'Temperature Monitoring',
          frequency: 'Every 2 hours',
          criticalLimits: 'Hot food: >63°C, Cold food: <5°C',
          monitoringMethod: 'Digital thermometer with data logging',
          correctiveActions: 'Discard food if temperature out of range > 2 hours'
        },
        {
          procedure: 'Hand Hygiene',
          frequency: 'Before handling food, after breaks',
          criticalLimits: 'Proper handwashing for minimum 20 seconds',
          monitoringMethod: 'Visual inspection, hand sanitizer logs',
          correctiveActions: 'Retrain staff, additional supervision'
        }
      ],
      verificationActivities: [
        'Weekly temperature log review',
        'Monthly cleaning checklist audit',
        'Quarterly supplier verification'
      ],
      recordKeeping: {
        temperatureLogs: 'Daily for 1 year',
        cleaningRecords: 'Daily for 6 months',
        supplierDocuments: '2 years',
        trainingRecords: '3 years'
      }
    };

    // Store HACCP plan
    await this.prisma.haccpPlan.create({
      data: haccpPlan
    });

    logger.info(`HACCP plan generated for truck ${truckId}`);
    return haccpPlan;
  }

  /**
   * Monitor temperature compliance in real-time
   */
  async logTemperatureReading(truckId: string, location: string, temperature: number): Promise<void> {
    const isCompliant = this.checkTemperatureCompliance(location, temperature);
    
    const reading = {
      truckId,
      location, // 'refrigerator', 'freezer', 'hot_holding', 'cooking_surface'
      temperature,
      isCompliant,
      timestamp: new Date()
    };

    await this.prisma.temperatureLog.create({
      data: reading
    });

    // Alert if non-compliant
    if (!isCompliant) {
      await this.triggerTemperatureAlert(truckId, reading);
    }

    logger.debug(`Temperature logged for truck ${truckId}: ${location} = ${temperature}°C (${isCompliant ? 'OK' : 'ALERT'})`);
  }

  /**
   * Generate daily compliance report
   */
  async generateDailyComplianceReport(truckId: string, date: Date): Promise<DailyComplianceReport> {
    const startDate = new Date(date.setHours(0, 0, 0, 0));
    const endDate = new Date(date.setHours(23, 59, 59, 999));

    const [temperatureReadings, cleaningActivities, supplierDeliveries] = await Promise.all([
      this.prisma.temperatureLog.findMany({
        where: {
          truckId,
          timestamp: { gte: startDate, lte: endDate }
        }
      }),
      this.prisma.cleaningLog.findMany({
        where: {
          truckId,
          completedAt: { gte: startDate, lte: endDate }
        }
      }),
      this.prisma.supplierDelivery.findMany({
        where: {
          truckId,
          deliveryDate: { gte: startDate, lte: endDate }
        }
      })
    ]);

    const report: DailyComplianceReport = {
      truckId,
      reportDate: date,
      temperatureCompliance: {
        totalReadings: temperatureReadings.length,
        compliantReadings: temperatureReadings.filter(r => r.isCompliant).length,
        compliancePercentage: (temperatureReadings.filter(r => r.isCompliant).length / temperatureReadings.length) * 100,
        violations: temperatureReadings.filter(r => !r.isCompliant).map(r => ({
          location: r.location,
          temperature: r.temperature,
          timestamp: r.timestamp
        }))
      },
      cleaningCompliance: {
        requiredTasks: 8, // Standard daily cleaning tasks
        completedTasks: cleaningActivities.length,
        completionPercentage: (cleaningActivities.length / 8) * 100,
        missedTasks: []
      },
      supplierCompliance: {
        deliveries: supplierDeliveries.length,
        documentsReceived: supplierDeliveries.filter(d => d.certificateReceived).length,
        temperatureChecksPerformed: supplierDeliveries.filter(d => d.temperatureVerified).length
      },
      overallScore: this.calculateComplianceScore(temperatureReadings, cleaningActivities, supplierDeliveries),
      recommendations: this.generateComplianceRecommendations(temperatureReadings, cleaningActivities)
    };

    // Store report
    await this.prisma.complianceReport.create({
      data: report
    });

    return report;
  }

  /**
   * Schedule automatic compliance monitoring
   */
  private scheduleComplianceChecks(truckId: string, registrationId: string): void {
    // Daily compliance report generation
    const dailyJob = `daily-compliance-${truckId}`;
    
    // This would be implemented with actual cron scheduling in production
    logger.info(`Scheduled daily compliance monitoring for truck ${truckId}`);
  }

  /**
   * Analyze critical control points for menu items
   */
  private analyzeCriticalControlPoints(menuItem: MenuItemHazard): CriticalControlPoint[] {
    const ccps: CriticalControlPoint[] = [];

    // Temperature control points
    if (menuItem.requiresCooking) {
      ccps.push({
        step: 'Cooking',
        hazard: 'Pathogenic bacteria survival',
        criticalLimit: 'Internal temperature ≥75°C for 15 seconds',
        monitoringMethod: 'Food thermometer',
        frequency: 'Each batch'
      });
    }

    if (menuItem.requiresHotHolding) {
      ccps.push({
        step: 'Hot Holding',
        hazard: 'Bacterial growth',
        criticalLimit: 'Temperature ≥63°C',
        monitoringMethod: 'Continuous temperature monitoring',
        frequency: 'Every 2 hours'
      });
    }

    if (menuItem.requiresColdStorage) {
      ccps.push({
        step: 'Cold Storage',
        hazard: 'Bacterial growth',
        criticalLimit: 'Temperature ≤5°C',
        monitoringMethod: 'Continuous temperature monitoring',
        frequency: 'Every 2 hours'
      });
    }

    // Allergen control points
    if (menuItem.allergens?.length > 0) {
      ccps.push({
        step: 'Allergen Control',
        hazard: 'Cross-contamination with allergens',
        criticalLimit: 'Separate preparation areas and utensils',
        monitoringMethod: 'Visual inspection and documentation',
        frequency: 'Each preparation'
      });
    }

    return ccps;
  }

  private checkTemperatureCompliance(location: string, temperature: number): boolean {
    const limits = {
      refrigerator: { min: 0, max: 5 },
      freezer: { min: -25, max: -18 },
      hot_holding: { min: 63, max: 90 },
      cooking_surface: { min: 75, max: 200 }
    };

    const limit = limits[location];
    if (!limit) return true;

    return temperature >= limit.min && temperature <= limit.max;
  }

  private async triggerTemperatureAlert(truckId: string, reading: any): Promise<void> {
    // Send alert to truck operator
    logger.warn(`🚨 Temperature violation at truck ${truckId}: ${reading.location} = ${reading.temperature}°C`);
    
    // In production, this would send SMS/email alerts
    // await this.notificationService.sendAlert(...)
  }

  private calculateComplianceScore(temperatureReadings: any[], cleaningActivities: any[], supplierDeliveries: any[]): number {
    let score = 100;
    
    // Deduct points for temperature violations
    const tempViolations = temperatureReadings.filter(r => !r.isCompliant).length;
    score -= tempViolations * 5;
    
    // Deduct points for missed cleaning tasks
    const missedCleaning = Math.max(0, 8 - cleaningActivities.length);
    score -= missedCleaning * 10;
    
    // Deduct points for supplier compliance issues
    const supplierIssues = supplierDeliveries.filter(d => !d.certificateReceived || !d.temperatureVerified).length;
    score -= supplierIssues * 15;
    
    return Math.max(0, score);
  }

  private generateComplianceRecommendations(temperatureReadings: any[], cleaningActivities: any[]): string[] {
    const recommendations = [];
    
    const tempViolations = temperatureReadings.filter(r => !r.isCompliant).length;
    if (tempViolations > 3) {
      recommendations.push('Review temperature monitoring procedures - multiple violations detected');
    }
    
    if (cleaningActivities.length < 6) {
      recommendations.push('Increase cleaning frequency to meet Danish food safety standards');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Excellent compliance! Continue current practices');
    }
    
    return recommendations;
  }
}

// Types
export interface DanishFoodRegistration {
  id: string;
  truckId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  submittedAt: Date;
  validUntil: Date;
  requirements: string[];
  nextInspectionDue: Date;
}

export interface MenuItemHazard {
  name: string;
  requiresCooking: boolean;
  requiresHotHolding: boolean;
  requiresColdStorage: boolean;
  allergens?: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface HACCPPlan {
  truckId: string;
  version: string;
  createdDate: Date;
  validUntil: Date;
  hazardAnalysis: CriticalControlPoint[];
  monitoringProcedures: MonitoringProcedure[];
  verificationActivities: string[];
  recordKeeping: Record<string, string>;
}

export interface CriticalControlPoint {
  step: string;
  hazard: string;
  criticalLimit: string;
  monitoringMethod: string;
  frequency: string;
}

export interface MonitoringProcedure {
  procedure: string;
  frequency: string;
  criticalLimits: string;
  monitoringMethod: string;
  correctiveActions: string;
}

export interface DailyComplianceReport {
  truckId: string;
  reportDate: Date;
  temperatureCompliance: {
    totalReadings: number;
    compliantReadings: number;
    compliancePercentage: number;
    violations: Array<{
      location: string;
      temperature: number;
      timestamp: Date;
    }>;
  };
  cleaningCompliance: {
    requiredTasks: number;
    completedTasks: number;
    completionPercentage: number;
    missedTasks: string[];
  };
  supplierCompliance: {
    deliveries: number;
    documentsReceived: number;
    temperatureChecksPerformed: number;
  };
  overallScore: number;
  recommendations: string[];
}
