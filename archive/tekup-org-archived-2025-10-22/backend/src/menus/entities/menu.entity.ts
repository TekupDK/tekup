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
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { MenuItem } from './menu-item.entity';

export enum MenuStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
}

@Entity('menus')
export class Menu {
  @ApiProperty({ description: 'Unique identifier for the menu' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Menu name' })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({ description: 'Menu description' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ enum: MenuStatus, description: 'Menu status' })
  @Column({
    type: 'enum',
    enum: MenuStatus,
    default: MenuStatus.DRAFT,
  })
  status: MenuStatus;

  @ApiProperty({ description: 'Menu display order' })
  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @ApiProperty({ description: 'Whether the menu is available' })
  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @ApiProperty({ description: 'Menu availability schedule as JSON' })
  @Column({ name: 'availability_schedule', type: 'jsonb', nullable: true })
  availabilitySchedule?: Record<string, any>;

  @ApiProperty({ description: 'When the menu was created' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'When the menu was last updated' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ApiProperty({ description: 'Restaurant ID' })
  @Column({ name: 'restaurant_id' })
  restaurantId: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menus)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @OneToMany(() => MenuItem, (menuItem) => menuItem.menu)
  menuItems: MenuItem[];
}