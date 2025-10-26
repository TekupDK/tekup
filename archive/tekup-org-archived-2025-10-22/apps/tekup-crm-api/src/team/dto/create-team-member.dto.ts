import { IsString, IsOptional, IsEnum, IsArray, IsNumber, IsObject, IsEmail, MinLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TeamRole, CleaningSkill } from '@prisma/client';

export class CreateTeamMemberDto {
  @ApiProperty({
    description: 'Team member full name',
    example: 'Anna Larsen',
  })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;

  @ApiProperty({
    description: 'Team member role',
    enum: TeamRole,
    example: TeamRole.CLEANER,
    required: false,
  })
  @IsOptional()
  @IsEnum(TeamRole, { message: 'Please provide a valid team role' })
  role?: TeamRole;

  @ApiProperty({
    description: 'Phone number',
    example: '+45 31 87 65 43',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Email address',
    example: 'anna@rengoeringsfirmaet.dk',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiProperty({
    description: 'Hourly rate in DKK',
    example: 250,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(100, { message: 'Hourly rate must be at least 100 DKK' })
  hourlyRate?: number;

  @ApiProperty({
    description: 'Cleaning skills',
    enum: CleaningSkill,
    isArray: true,
    example: [CleaningSkill.BASIC_CLEANING, CleaningSkill.WINDOW_CLEANING],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(CleaningSkill, { each: true, message: 'Please provide valid cleaning skills' })
  skills?: CleaningSkill[];

  @ApiProperty({
    description: 'Certifications',
    example: ['Kemikaliesikkerhed', 'Førstehjælp', 'Arbejdsmiljø'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiProperty({
    description: 'Weekly availability schedule',
    example: {
      monday: [{ start: '08:00', end: '16:00', available: true }],
      tuesday: [{ start: '08:00', end: '16:00', available: true }],
      wednesday: [{ start: '08:00', end: '16:00', available: true }],
      thursday: [{ start: '08:00', end: '16:00', available: true }],
      friday: [{ start: '08:00', end: '15:00', available: true }],
      saturday: [{ start: '09:00', end: '13:00', available: true }],
      sunday: [{ start: '09:00', end: '13:00', available: false }]
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  availability?: any;
}
