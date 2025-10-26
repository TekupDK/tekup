import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
// TODO: Create User entity
// import { User } from '../../auth/entities/user.entity';
import { VoiceCommand } from '../../voice-processing/entities/voice-command.entity';

export interface VoiceCommandConfig {
  name: string;
  type: string;
  examples: string[];
  parameters: string[];
  response_template: string;
}

export interface IntegrationConfig {
  type: string;
  endpoint: string;
  auth_method: string;
  credentials?: Record<string, any>;
}

@Entity('business_configs')
export class BusinessConfig {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for the business configuration' })
  id: string;

  @Column('varchar', { length: 100 })
  @ApiProperty({ description: 'Business name' })
  name: string;

  @Column('varchar', { length: 50 })
  @ApiProperty({ 
    description: 'Business type',
    enum: ['restaurant', 'retail', 'service', 'healthcare', 'manufacturing', 'other']
  })
  type: string;

  @Column('varchar', { length: 20, default: 'da-DK' })
  @ApiProperty({ description: 'Primary language for voice processing' })
  language: string;

  @Column('varchar', { length: 20, default: 'casual' })
  @ApiProperty({ 
    description: 'Voice interaction style',
    enum: ['casual', 'formal', 'technical']
  })
  voiceStyle: string;

  @Column('jsonb', { default: [] })
  @ApiProperty({ 
    description: 'Available voice commands for this business',
    type: 'array',
    items: { type: 'object' }
  })
  voiceCommands: VoiceCommandConfig[];

  @Column('jsonb', { default: [] })
  @ApiProperty({ 
    description: 'External system integrations',
    type: 'array', 
    items: { type: 'object' }
  })
  integrations: IntegrationConfig[];

  @Column('jsonb', { default: {} })
  @ApiProperty({ 
    description: 'Business-specific settings and preferences',
    type: 'object'
  })
  settings: Record<string, any>;

  @Column('boolean', { default: true })
  @ApiProperty({ description: 'Whether voice processing is active for this business' })
  isActive: boolean;

  @Column('varchar', { length: 50, default: 'starter' })
  @ApiProperty({ 
    description: 'Subscription plan',
    enum: ['starter', 'professional', 'enterprise']
  })
  plan: string;

  @Column('int', { default: 1000 })
  @ApiProperty({ description: 'Monthly voice command limit' })
  monthlyCommandLimit: number;

  @Column('int', { default: 0 })
  @ApiProperty({ description: 'Commands used this month' })
  currentMonthUsage: number;

  @Column('uuid')
  @ApiProperty({ description: 'Owner of this business configuration' })
  userId: string;

  @CreateDateColumn()
  @ApiProperty({ description: 'When the business was configured' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Last configuration update' })
  updatedAt: Date;

  // Relations
  // TODO: Uncomment when User entity is created
  // @ManyToOne(() => User, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'userId' })
  // user: User;

  @OneToMany(() => VoiceCommand, voiceCommand => voiceCommand.business)
  commands: VoiceCommand[];

  // Helper methods
  getRemainingCommands(): number {
    return Math.max(0, this.monthlyCommandLimit - this.currentMonthUsage);
  }

  canProcessCommand(): boolean {
    return this.isActive && this.getRemainingCommands() > 0;
  }

  getCommandByName(commandName: string): VoiceCommandConfig | undefined {
    return this.voiceCommands.find(cmd => cmd.name === commandName);
  }
}