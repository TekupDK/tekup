import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../auth/entities/user.entity';
import { BusinessConfig } from '../../business-config/entities/business-config.entity';

@Entity('voice_commands')
export class VoiceCommand {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for the voice command' })
  id: string;

  @Column('text')
  @ApiProperty({ description: 'Original transcript from speech-to-text' })
  transcript: string;

  @Column('varchar', { length: 100 })
  @ApiProperty({ description: 'Recognized intent/command name' })
  intent: string;

  @Column('float', { default: 0 })
  @ApiProperty({ description: 'Confidence score (0-1)' })
  confidence: number;

  @Column('jsonb', { nullable: true })
  @ApiProperty({ description: 'Extracted parameters from the command' })
  parameters: Record<string, any>;

  @Column('boolean', { default: false })
  @ApiProperty({ description: 'Whether the command was executed successfully' })
  success: boolean;

  @Column('text', { nullable: true })
  @ApiProperty({ description: 'Response message or error details' })
  responseMessage: string;

  @Column('int', { default: 0 })
  @ApiProperty({ description: 'Processing time in milliseconds' })
  processingTime: number;

  @Column('varchar', { length: 20, default: 'da-DK' })
  @ApiProperty({ description: 'Language code used for processing' })
  language: string;

  @Column('varchar', { length: 50, nullable: true })
  @ApiProperty({ description: 'Audio format of the original file' })
  audioFormat: string;

  @Column('int', { nullable: true })
  @ApiProperty({ description: 'Audio duration in milliseconds' })
  audioDuration: number;

  @Column('uuid')
  @ApiProperty({ description: 'User who issued the command' })
  userId: string;

  @Column('uuid')
  @ApiProperty({ description: 'Business context for the command' })
  businessId: string;

  @CreateDateColumn()
  @ApiProperty({ description: 'When the command was processed' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Last updated timestamp' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => BusinessConfig, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: BusinessConfig;
}