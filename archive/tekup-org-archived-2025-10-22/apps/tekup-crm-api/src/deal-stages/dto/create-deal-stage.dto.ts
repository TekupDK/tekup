import { IsString, IsBoolean, IsNumber } from 'class-validator';

export class CreateDealStageDto {
  @IsString()
  tenantId: string;

  @IsString()
  name: string;

  @IsNumber()
  order: number;

  @IsBoolean()
  isClosed: boolean;

  @IsBoolean()
  isWon: boolean;
}