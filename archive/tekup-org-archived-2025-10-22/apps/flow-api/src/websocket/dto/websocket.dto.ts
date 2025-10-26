import { IsString, IsOptional, IsArray, IsEnum, IsBoolean, IsNumber, IsDate } from 'class-validator';
import { Transform } from 'class-transformer';

export class SubscribeDto {
  @IsArray()
  @IsString({ each: true })
  channels: string[] = [];
}

export class UnsubscribeDto {
  @IsArray()
  @IsString({ each: true })
  channels: string[] = [];
}

export class SendTestNotificationDto {
  @IsString()
  message: string = '';

  @IsOptional()
  @IsString()
  type?: string;
}

export class SendBulkNotificationDto {
  @IsString()
  message: string = '';

  @IsString()
  type: string = '';

  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class NotificationPayloadDto {
  @IsString()
  type: string = '';

  @IsOptional()
  data?: any;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  timestamp: Date = new Date();

  @IsString()
  tenantId: string = '';
}

export class ClientConnectionDto {
  @IsString()
  socketId: string = '';

  @IsString()
  tenantId: string = '';

  @IsOptional()
  @IsString()
  userId?: string;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  connectedAt: Date = new Date();

  @IsDate()
  @Transform(({ value }) => new Date(value))
  lastActivity: Date = new Date();
}