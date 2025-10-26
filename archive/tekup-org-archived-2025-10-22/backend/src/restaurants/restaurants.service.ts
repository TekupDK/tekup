import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant, RestaurantStatus } from './entities/restaurant.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  async create(createRestaurantDto: CreateRestaurantDto, owner: User): Promise<Restaurant> {
    const restaurant = this.restaurantRepository.create({
      ...createRestaurantDto,
      ownerId: owner.id,
      status: RestaurantStatus.PENDING,
    });

    return this.restaurantRepository.save(restaurant);
  }

  async findAll(user?: User): Promise<Restaurant[]> {
    const query = this.restaurantRepository.createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.owner', 'owner')
      .select([
        'restaurant.id',
        'restaurant.name',
        'restaurant.description',
        'restaurant.address',
        'restaurant.city',
        'restaurant.postalCode',
        'restaurant.country',
        'restaurant.phoneNumber',
        'restaurant.email',
        'restaurant.websiteUrl',
        'restaurant.cuisineType',
        'restaurant.status',
        'restaurant.logoUrl',
        'restaurant.coverImageUrl',
        'restaurant.averageRating',
        'restaurant.totalReviews',
        'restaurant.isVerified',
        'restaurant.createdAt',
        'restaurant.updatedAt',
        'owner.id',
        'owner.firstName',
        'owner.lastName',
        'owner.email',
      ]);

    // Filter based on user role
    if (user) {
      if (user.role === UserRole.RESTAURANT_OWNER) {
        query.where('restaurant.ownerId = :ownerId', { ownerId: user.id });
      } else if (user.role === UserRole.CUSTOMER) {
        query.where('restaurant.status = :status', { status: RestaurantStatus.ACTIVE });
      }
      // Super admin can see all restaurants
    } else {
      // Public access - only active restaurants
      query.where('restaurant.status = :status', { status: RestaurantStatus.ACTIVE });
    }

    return query.getMany();
  }

  async findOne(id: string, user?: User): Promise<Restaurant> {
    const query = this.restaurantRepository.createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.owner', 'owner')
      .leftJoinAndSelect('restaurant.menus', 'menus')
      .where('restaurant.id = :id', { id });

    const restaurant = await query.getOne();

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    // Check access permissions
    if (user) {
      if (user.role === UserRole.RESTAURANT_OWNER && restaurant.ownerId !== user.id) {
        throw new ForbiddenException('You can only access your own restaurants');
      }
      if (user.role === UserRole.CUSTOMER && restaurant.status !== RestaurantStatus.ACTIVE) {
        throw new NotFoundException(`Restaurant with ID ${id} not found`);
      }
    } else {
      // Public access - only active restaurants
      if (restaurant.status !== RestaurantStatus.ACTIVE) {
        throw new NotFoundException(`Restaurant with ID ${id} not found`);
      }
    }

    return restaurant;
  }

  async findByOwner(ownerId: string): Promise<Restaurant[]> {
    return this.restaurantRepository.find({
      where: { ownerId },
      relations: ['owner'],
    });
  }

  async update(id: string, updateRestaurantDto: UpdateRestaurantDto, user: User): Promise<Restaurant> {
    const restaurant = await this.findOne(id, user);

    // Only owner or super admin can update
    if (user.role !== UserRole.SUPER_ADMIN && restaurant.ownerId !== user.id) {
      throw new ForbiddenException('You can only update your own restaurants');
    }

    // Only super admin can change status
    if (updateRestaurantDto.status && user.role !== UserRole.SUPER_ADMIN) {
      delete updateRestaurantDto.status;
    }

    Object.assign(restaurant, updateRestaurantDto);
    return this.restaurantRepository.save(restaurant);
  }

  async remove(id: string, user: User): Promise<void> {
    const restaurant = await this.findOne(id, user);

    // Only owner or super admin can delete
    if (user.role !== UserRole.SUPER_ADMIN && restaurant.ownerId !== user.id) {
      throw new ForbiddenException('You can only delete your own restaurants');
    }

    await this.restaurantRepository.remove(restaurant);
  }

  async updateStatus(id: string, status: RestaurantStatus): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({ where: { id } });
    
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    restaurant.status = status;
    return this.restaurantRepository.save(restaurant);
  }

  async verify(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({ where: { id } });
    
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    restaurant.isVerified = true;
    return this.restaurantRepository.save(restaurant);
  }

  async unverify(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({ where: { id } });
    
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    restaurant.isVerified = false;
    return this.restaurantRepository.save(restaurant);
  }

  async updateRating(id: string, newRating: number): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({ where: { id } });
    
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    // Calculate new average rating
    const totalRating = restaurant.averageRating * restaurant.totalReviews + newRating;
    restaurant.totalReviews += 1;
    restaurant.averageRating = Number((totalRating / restaurant.totalReviews).toFixed(2));

    return this.restaurantRepository.save(restaurant);
  }

  async searchRestaurants(query: string, city?: string, cuisineType?: string): Promise<Restaurant[]> {
    const queryBuilder = this.restaurantRepository.createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.owner', 'owner')
      .where('restaurant.status = :status', { status: RestaurantStatus.ACTIVE });

    if (query) {
      queryBuilder.andWhere(
        '(restaurant.name ILIKE :query OR restaurant.description ILIKE :query)',
        { query: `%${query}%` }
      );
    }

    if (city) {
      queryBuilder.andWhere('restaurant.city ILIKE :city', { city: `%${city}%` });
    }

    if (cuisineType) {
      queryBuilder.andWhere('restaurant.cuisineType = :cuisineType', { cuisineType });
    }

    return queryBuilder
      .orderBy('restaurant.averageRating', 'DESC')
      .addOrderBy('restaurant.totalReviews', 'DESC')
      .getMany();
  }
}