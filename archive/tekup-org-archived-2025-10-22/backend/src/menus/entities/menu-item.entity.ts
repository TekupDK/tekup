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
import { Menu } from './menu.entity';

export enum MenuItemStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  OUT_OF_STOCK = 'out_of_stock',
}

export enum DietaryRestriction {
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  GLUTEN_FREE = 'gluten_free',
  DAIRY_FREE = 'dairy_free',
  NUT_FREE = 'nut_free',
  HALAL = 'halal',
  KOSHER = 'kosher',
}

@Entity('menu_items')
export class MenuItem {
  @ApiProperty({ description: 'Unique identifier for the menu item' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Menu item name' })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({ description: 'Menu item description' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Menu item price' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ description: 'Menu item category' })
  @Column({ length: 100, nullable: true })
  category?: string;

  @ApiProperty({ enum: MenuItemStatus, description: 'Menu item status' })
  @Column({
    type: 'enum',
    enum: MenuItemStatus,
    default: MenuItemStatus.AVAILABLE,
  })
  status: MenuItemStatus;

  @ApiProperty({ description: 'Menu item image URL' })
  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string;

  @ApiProperty({ description: 'Menu item display order within category' })
  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @ApiProperty({ description: 'Preparation time in minutes' })
  @Column({ name: 'preparation_time', nullable: true })
  preparationTime?: number;

  @ApiProperty({ description: 'Calories per serving' })
  @Column({ nullable: true })
  calories?: number;

  @ApiProperty({ description: 'List of ingredients' })
  @Column({ type: 'text', array: true, nullable: true })
  ingredients?: string[];

  @ApiProperty({ description: 'List of allergens' })
  @Column({ type: 'text', array: true, nullable: true })
  allergens?: string[];

  @ApiProperty({ enum: DietaryRestriction, isArray: true, description: 'Dietary restrictions' })
  @Column({ 
    name: 'dietary_restrictions',
    type: 'enum', 
    enum: DietaryRestriction, 
    array: true, 
    nullable: true 
  })
  dietaryRestrictions?: DietaryRestriction[];

  @ApiProperty({ description: 'Whether the item is spicy' })
  @Column({ name: 'is_spicy', default: false })
  isSpicy: boolean;

  @ApiProperty({ description: 'Spice level (1-5)' })
  @Column({ name: 'spice_level', nullable: true })
  spiceLevel?: number;

  @ApiProperty({ description: 'Whether the item is popular' })
  @Column({ name: 'is_popular', default: false })
  isPopular: boolean;

  @ApiProperty({ description: 'Whether the item is a chef recommendation' })
  @Column({ name: 'is_chef_recommendation', default: false })
  isChefRecommendation: boolean;

  @ApiProperty({ description: 'Nutritional information as JSON' })
  @Column({ name: 'nutritional_info', type: 'jsonb', nullable: true })
  nutritionalInfo?: Record<string, any>;

  @ApiProperty({ description: 'When the menu item was created' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'When the menu item was last updated' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ApiProperty({ description: 'Menu ID' })
  @Column({ name: 'menu_id' })
  menuId: string;

  @ManyToOne(() => Menu, (menu) => menu.menuItems)
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;
}