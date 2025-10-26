import { IsEnum } from 'class-validator';

// Mirror Prisma enum (cannot import before client is generated in some build phases)
export enum LeadStatusDto {
  new = 'new',
  contacted = 'contacted'
}

export class ChangeStatusDto {
  @IsEnum(LeadStatusDto)
  status!: LeadStatusDto;
  actor?: string;
}
