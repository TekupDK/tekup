import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { Restaurant, RestaurantStatus, CuisineType } from './entities/restaurant.entity';

@ApiTags('Restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new restaurant' })
  @ApiResponse({ status: 201, description: 'Restaurant successfully created', type: Restaurant })
  @ApiResponse({ status: 403, description: 'Forbidden - Restaurant owner access required' })
  create(@Body() createRestaurantDto: CreateRestaurantDto, @GetUser() user: User) {
    return this.restaurantsService.create(createRestaurantDto, user);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all restaurants' })
  @ApiResponse({ status: 200, description: 'Restaurants retrieved successfully', type: [Restaurant] })
  @ApiQuery({ name: 'search', required: false, description: 'Search query for restaurant name or description' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'cuisineType', required: false, enum: CuisineType, description: 'Filter by cuisine type' })
  async findAll(
    @Query('search') search?: string,
    @Query('city') city?: string,
    @Query('cuisineType') cuisineType?: CuisineType,
    @GetUser() user?: User,
  ) {
    if (search || city || cuisineType) {
      return this.restaurantsService.searchRestaurants(search, city, cuisineType);
    }
    return this.restaurantsService.findAll(user);
  }

  @Get('my-restaurants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user\'s restaurants' })
  @ApiResponse({ status: 200, description: 'User restaurants retrieved successfully', type: [Restaurant] })
  getMyRestaurants(@GetUser() user: User) {
    return this.restaurantsService.findByOwner(user.id);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get restaurant by ID' })
  @ApiResponse({ status: 200, description: 'Restaurant retrieved successfully', type: Restaurant })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user?: User) {
    return this.restaurantsService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update restaurant' })
  @ApiResponse({ status: 200, description: 'Restaurant updated successfully', type: Restaurant })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only update own restaurants' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
    @GetUser() user: User,
  ) {
    return this.restaurantsService.update(id, updateRestaurantDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete restaurant' })
  @ApiResponse({ status: 200, description: 'Restaurant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only delete own restaurants' })
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.restaurantsService.remove(id, user);
  }

  // Admin-only endpoints
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update restaurant status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Restaurant status updated successfully', type: Restaurant })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: RestaurantStatus,
  ) {
    return this.restaurantsService.updateStatus(id, status);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify restaurant (Admin only)' })
  @ApiResponse({ status: 200, description: 'Restaurant verified successfully', type: Restaurant })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  verify(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantsService.verify(id);
  }

  @Patch(':id/unverify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unverify restaurant (Admin only)' })
  @ApiResponse({ status: 200, description: 'Restaurant unverified successfully', type: Restaurant })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  unverify(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantsService.unverify(id);
  }

  @Post(':id/rating')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add rating to restaurant' })
  @ApiResponse({ status: 200, description: 'Rating added successfully', type: Restaurant })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  addRating(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('rating') rating: number,
  ) {
    return this.restaurantsService.updateRating(id, rating);
  }
}