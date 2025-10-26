import { Injectable } from '@nestjs/common';
import { DanishBusinessUtils, DANISH_CLEANING_INDUSTRY_STANDARDS, DANISH_HOLIDAYS_2025, DANISH_HOLIDAYS_2026 } from './danish-business.utils';

@Injectable()
export class DanishBusinessService {
  /**
   * Validate Danish postal code
   */
  validatePostalCode(postalCode: string): boolean {
    return DanishBusinessUtils.isValidPostalCode(postalCode);
  }

  /**
   * Get city name from Danish postal code
   */
  getCityFromPostalCode(postalCode: string): string | null {
    return DanishBusinessUtils.getCityFromPostalCode(postalCode);
  }

  /**
   * Check if date is Danish holiday
   */
  isDanishHoliday(date: Date): boolean {
    return DanishBusinessUtils.isDanishHoliday(date);
  }

  /**
   * Get Danish holidays for a year
   */
  getDanishHolidays(year: number) {
    return year === 2025 ? DANISH_HOLIDAYS_2025 : DANISH_HOLIDAYS_2026;
  }

  /**
   * Get standard job duration for job type
   */
  getStandardJobDuration(jobType: string): number {
    return DanishBusinessUtils.getStandardJobDuration(jobType);
  }

  /**
   * Get standard hourly rate for role
   */
  getStandardHourlyRate(role: string): number {
    return DanishBusinessUtils.getStandardHourlyRate(role);
  }

  /**
   * Validate Danish phone number
   */
  validateDanishPhone(phone: string): boolean {
    return DanishBusinessUtils.isValidDanishPhone(phone);
  }

  /**
   * Format Danish phone number
   */
  formatDanishPhone(phone: string): string {
    return DanishBusinessUtils.formatDanishPhone(phone);
  }

  /**
   * Get Danish cleaning industry standards
   */
  getCleaningIndustryStandards() {
    return DANISH_CLEANING_INDUSTRY_STANDARDS;
  }

  /**
   * Get required certifications for job type
   */
  getRequiredCertifications(jobType: string): string[] {
    const standards = DANISH_CLEANING_INDUSTRY_STANDARDS.CLEANING_RULES.REQUIRED_CERTIFICATIONS;
    return standards[jobType as keyof typeof standards] || [];
  }

  /**
   * Check if job type is weather dependent
   */
  isWeatherDependent(jobType: string): boolean {
    const weatherDependent = DANISH_CLEANING_INDUSTRY_STANDARDS.CLEANING_RULES.WEATHER_DEPENDENT;
    return weatherDependent.includes(jobType);
  }

  /**
   * Get maximum wind speed for window cleaning
   */
  getMaxWindSpeedForWindowCleaning(): number {
    return DANISH_CLEANING_INDUSTRY_STANDARDS.CLEANING_RULES.MAX_WIND_SPEED_WINDOW_CLEANING;
  }

  /**
   * Get Danish business hours
   */
  getDanishBusinessHours() {
    return DANISH_CLEANING_INDUSTRY_STANDARDS.BUSINESS_HOURS;
  }

  /**
   * Get Danish postal code ranges
   */
  getDanishPostalCodeRanges() {
    return DanishBusinessUtils.DANISH_POSTAL_CODES;
  }
}
