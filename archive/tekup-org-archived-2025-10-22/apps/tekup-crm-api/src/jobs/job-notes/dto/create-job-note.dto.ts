import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NoteType } from '@prisma/client';

export class CreateJobNoteDto {
  @ApiProperty({
    description: 'Note text content',
    example: 'Customer requested extra attention to kitchen area',
  })
  @IsString()
  @MinLength(5, { message: 'Note text must be at least 5 characters long' })
  text: string;

  @ApiProperty({
    description: 'Note type',
    enum: NoteType,
    example: NoteType.GENERAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(NoteType, { message: 'Please provide a valid note type' })
  type?: NoteType;

  @ApiProperty({
    description: 'User who created the note',
    example: 'user-123',
  })
  @IsString()
  createdBy: string;
}
