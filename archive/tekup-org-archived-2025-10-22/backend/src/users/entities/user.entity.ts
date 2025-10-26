import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  RESTAURANT_OWNER = 'restaurant_owner',
  RESTAURANT_MANAGER = 'restaurant_manager',
  RESTAURANT_STAFF = 'restaurant_staff',
  CUSTOMER = 'customer',
}

@Entity('users')
export class User {
  @ApiProperty({ description: 'Unique identifier for the user' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User first name' })
  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @ApiProperty({ description: 'User email address' })
  @Column({ unique: true, length: 255 })
  email: string;

  @Exclude()
  @Column({ length: 255 })
  password: string;

  @ApiProperty({ description: 'User phone number' })
  @Column({ name: 'phone_number', length: 20, nullable: true })
  phoneNumber?: string;

  @ApiProperty({ enum: UserRole, description: 'User role in the system' })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @ApiProperty({ description: 'Whether the user account is active' })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'User profile image URL' })
  @Column({ name: 'profile_image_url', nullable: true })
  profileImageUrl?: string;

  @ApiProperty({ description: 'User preferences as JSON' })
  @Column({ type: 'jsonb', nullable: true })
  preferences?: Record<string, any>;

  @ApiProperty({ description: 'When the user was created' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'When the user was last updated' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Restaurant, (restaurant) => restaurant.owner)
  restaurants: Restaurant[];

  // Virtual properties
  @ApiProperty({ description: 'User full name' })
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}