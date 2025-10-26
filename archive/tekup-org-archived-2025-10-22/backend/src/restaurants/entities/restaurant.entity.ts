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
import { User } from '../../users/entities/user.entity';
import { Menu } from '../../menus/entities/menu.entity';

export enum RestaurantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

export enum CuisineType {
  ITALIAN = 'italian',
  CHINESE = 'chinese',
  INDIAN = 'indian',
  MEXICAN = 'mexican',
  FRENCH = 'french',
  JAPANESE = 'japanese',
  THAI = 'thai',
  AMERICAN = 'american',
  MEDITERRANEAN = 'mediterranean',
  DANISH = 'danish',
  INTERNATIONAL = 'international',
  OTHER = 'other',
}

@Entity('restaurants')
export class Restaurant {
  @ApiProperty({ description: 'Unique identifier for the restaurant' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Restaurant name' })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({ description: 'Restaurant description' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Restaurant address' })
  @Column({ length: 500 })
  address: string;

  @ApiProperty({ description: 'Restaurant city' })
  @Column({ length: 100 })
  city: string;

  @ApiProperty({ description: 'Restaurant postal code' })
  @Column({ name: 'postal_code', length: 20 })
  postalCode: string;

  @ApiProperty({ description: 'Restaurant country' })
  @Column({ length: 100, default: 'Denmark' })
  country: string;

  @ApiProperty({ description: 'Restaurant phone number' })
  @Column({ name: 'phone_number', length: 20 })
  phoneNumber: string;

  @ApiProperty({ description: 'Restaurant email address' })
  @Column({ length: 255, nullable: true })
  email?: string;

  @ApiProperty({ description: 'Restaurant website URL' })
  @Column({ name: 'website_url', nullable: true })
  websiteUrl?: string;

  @ApiProperty({ enum: CuisineType, description: 'Type of cuisine served' })
  @Column({
    name: 'cuisine_type',
    type: 'enum',
    enum: CuisineType,
    default: CuisineType.INTERNATIONAL,
  })
  cuisineType: CuisineType;

  @ApiProperty({ enum: RestaurantStatus, description: 'Restaurant status' })
  @Column({
    type: 'enum',
    enum: RestaurantStatus,
    default: RestaurantStatus.PENDING,
  })
  status: RestaurantStatus;

  @ApiProperty({ description: 'Restaurant logo URL' })
  @Column({ name: 'logo_url', nullable: true })
  logoUrl?: string;

  @ApiProperty({ description: 'Restaurant cover image URL' })
  @Column({ name: 'cover_image_url', nullable: true })
  coverImageUrl?: string;

  @ApiProperty({ description: 'Restaurant opening hours as JSON' })
  @Column({ name: 'opening_hours', type: 'jsonb', nullable: true })
  openingHours?: Record<string, any>;

  @ApiProperty({ description: 'Restaurant settings as JSON' })
  @Column({ type: 'jsonb', nullable: true })
  settings?: Record<string, any>;

  @ApiProperty({ description: 'Average rating of the restaurant' })
  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @ApiProperty({ description: 'Total number of reviews' })
  @Column({ name: 'total_reviews', default: 0 })
  totalReviews: number;

  @ApiProperty({ description: 'Whether the restaurant is verified' })
  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @ApiProperty({ description: 'When the restaurant was created' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'When the restaurant was last updated' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ApiProperty({ description: 'Restaurant owner ID' })
  @Column({ name: 'owner_id' })
  ownerId: string;

  @ManyToOne(() => User, (user) => user.restaurants)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => Menu, (menu) => menu.restaurant)
  menus: Menu[];

  // Virtual properties
  @ApiProperty({ description: 'Full address string' })
  get fullAddress(): string {
    return `${this.address}, ${this.city} ${this.postalCode}, ${this.country}`;
  }
}