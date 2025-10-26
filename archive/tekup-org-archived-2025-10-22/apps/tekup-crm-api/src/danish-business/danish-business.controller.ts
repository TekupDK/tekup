import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DanishBusinessService } from './danish-business.service';

@ApiTags('Danish Business')
@Controller('danish-business')
export class DanishBusinessController {
  constructor(private readonly danishBusinessService: DanishBusinessService) {}

  @Get('validate-postal-code')
  @ApiOperation({ summary: 'Validate Danish postal code' })
  @ApiQuery({ name: 'postalCode', description: 'Danish postal code (4 digits)', example: '2100' })
  @ApiResponse({ status: 200, description: 'Postal code validation result' })
  validatePostalCode(@Query('postalCode') postalCode: string) {
    const isValid = this.danishBusinessService.validatePostalCode(postalCode);
    const city = isValid ? this.danishBusinessService.getCityFromPostalCode(postalCode) : null;
    
    return {
      postalCode,
      isValid,
      city,
    };
  }

  @Get('validate-phone')
  @ApiOperation({ summary: 'Validate Danish phone number' })
  @ApiQuery({ name: 'phone', description: 'Danish phone number', example: '+45 33 12 34 56' })
  @ApiResponse({ status: 200, description: 'Phone number validation result' })
  validatePhone(@Query('phone') phone: string) {
    const isValid = this.danishBusinessService.validateDanishPhone(phone);
    const formatted = isValid ? this.danishBusinessService.formatDanishPhone(phone) : phone;
    
    return {
      phone,
      isValid,
      formatted,
    };
  }

  @Get('holidays/:year')
  @ApiOperation({ summary: 'Get Danish holidays for a year' })
  @ApiResponse({ status: 200, description: 'Danish holidays retrieved successfully' })
  getHolidays(@Param('year') year: number) {
    return this.danishBusinessService.getDanishHolidays(year);
  }

  @Get('check-holiday')
  @ApiOperation({ summary: 'Check if date is Danish holiday' })
  @ApiQuery({ name: 'date', description: 'Date to check (ISO format)', example: '2025-12-25' })
  @ApiResponse({ status: 200, description: 'Holiday check result' })
  checkHoliday(@Query('date') date: string) {
    const checkDate = new Date(date);
    const isHoliday = this.danishBusinessService.isDanishHoliday(checkDate);
    
    return {
      date: checkDate.toISOString().split('T')[0],
      isHoliday,
    };
  }

  @Get('job-duration/:jobType')
  @ApiOperation({ summary: 'Get standard job duration for job type' })
  @ApiResponse({ status: 200, description: 'Job duration retrieved successfully' })
  getJobDuration(@Param('jobType') jobType: string) {
    const duration = this.danishBusinessService.getStandardJobDuration(jobType);
    
    return {
      jobType,
      durationMinutes: duration,
      durationHours: Math.round(duration / 60 * 10) / 10,
    };
  }

  @Get('hourly-rate/:role')
  @ApiOperation({ summary: 'Get standard hourly rate for role' })
  @ApiResponse({ status: 200, description: 'Hourly rate retrieved successfully' })
  getHourlyRate(@Param('role') role: string) {
    const rate = this.danishBusinessService.getStandardHourlyRate(role);
    
    return {
      role,
      hourlyRateDKK: rate,
    };
  }

  @Get('certifications/:jobType')
  @ApiOperation({ summary: 'Get required certifications for job type' })
  @ApiResponse({ status: 200, description: 'Required certifications retrieved successfully' })
  getRequiredCertifications(@Param('jobType') jobType: string) {
    const certifications = this.danishBusinessService.getRequiredCertifications(jobType);
    
    return {
      jobType,
      requiredCertifications: certifications,
    };
  }

  @Get('weather-dependent/:jobType')
  @ApiOperation({ summary: 'Check if job type is weather dependent' })
  @ApiResponse({ status: 200, description: 'Weather dependency check result' })
  isWeatherDependent(@Param('jobType') jobType: string) {
    const isWeatherDependent = this.danishBusinessService.isWeatherDependent(jobType);
    const maxWindSpeed = isWeatherDependent ? this.danishBusinessService.getMaxWindSpeedForWindowCleaning() : null;
    
    return {
      jobType,
      isWeatherDependent,
      maxWindSpeed,
    };
  }

  @Get('business-hours')
  @ApiOperation({ summary: 'Get Danish business hours' })
  @ApiResponse({ status: 200, description: 'Business hours retrieved successfully' })
  getBusinessHours() {
    return this.danishBusinessService.getDanishBusinessHours();
  }

  @Get('postal-code-ranges')
  @ApiOperation({ summary: 'Get Danish postal code ranges' })
  @ApiResponse({ status: 200, description: 'Postal code ranges retrieved successfully' })
  getPostalCodeRanges() {
    return this.danishBusinessService.getDanishPostalCodeRanges();
  }

  @Get('standards')
  @ApiOperation({ summary: 'Get Danish cleaning industry standards' })
  @ApiResponse({ status: 200, description: 'Industry standards retrieved successfully' })
  getStandards() {
    return this.danishBusinessService.getCleaningIndustryStandards();
  }
}
