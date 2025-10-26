// User types
export enum UserRole {
  ADMIN = 'admin',
  RESTAURANT_OWNER = 'restaurant_owner',
  MANAGER = 'manager',
  STAFF = 'staff',
  CUSTOMER = 'customer',
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  isActive: boolean;
  profileImageUrl?: string;
  preferences?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  fullName: string;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role?: UserRole;
  profileImageUrl?: string;
  preferences?: Record<string, any>;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role?: UserRole;
  profileImageUrl?: string;
  preferences?: Record<string, any>;
}

// Restaurant types
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

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  email: string;
  websiteUrl?: string;
  cuisineType: CuisineType;
  status: RestaurantStatus;
  logoUrl?: string;
  coverImageUrl?: string;
  openingHours?: Record<string, any>;
  settings?: Record<string, any>;
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  owner?: User;
  menus?: Menu[];
  fullAddress: string;
}

export interface CreateRestaurantDto {
  name: string;
  description?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  email: string;
  websiteUrl?: string;
  cuisineType: CuisineType;
  logoUrl?: string;
  coverImageUrl?: string;
  openingHours?: Record<string, any>;
  settings?: Record<string, any>;
}

export interface UpdateRestaurantDto extends Partial<CreateRestaurantDto> {
  status?: RestaurantStatus;
}

// Menu types
export enum MenuStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
}

export interface Menu {
  id: string;
  name: string;
  description?: string;
  status: MenuStatus;
  displayOrder: number;
  isAvailable: boolean;
  availabilitySchedule?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  restaurantId: string;
  restaurant?: Restaurant;
  menuItems?: MenuItem[];
}

// Menu Item types
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

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  status: MenuItemStatus;
  imageUrl?: string;
  displayOrder: number;
  preparationTime?: number;
  calories?: number;
  ingredients?: string[];
  allergens?: string[];
  dietaryRestrictions?: DietaryRestriction[];
  isSpicy: boolean;
  spiceLevel?: number;
  isPopular: boolean;
  isChefRecommendation: boolean;
  nutritionalInfo?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  menuId: string;
  menu?: Menu;
}

// Auth types
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Dashboard types
export interface DashboardStats {
  totalRestaurants: number;
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  revenueGrowth: number;
  orderGrowth: number;
  customerGrowth: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface PopularItem {
  id: string;
  name: string;
  orders: number;
  revenue: number;
}

// Form types
export interface FormError {
  field: string;
  message: string;
}

export interface FormState {
  isLoading: boolean;
  errors: FormError[];
  success: boolean;
}

// Navigation types
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavItem[];
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: string;
  read: boolean;
}