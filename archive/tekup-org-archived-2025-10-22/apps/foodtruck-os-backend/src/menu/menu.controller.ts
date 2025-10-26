import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TekUpAuthGuard, CurrentUser, CurrentTenant } from '@tekup/sso';
import { MenuService, CreateMenuItemDto, UpdateMenuItemDto } from './menu.service';

@ApiTags('menu')
@ApiBearerAuth()
@UseGuards(TekUpAuthGuard)
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post('items')
  @ApiOperation({ summary: 'Create new menu item' })
  async createMenuItem(
    @Body() data: CreateMenuItemDto,
    @CurrentTenant() tenant: any
  ) {
    return this.menuService.createMenuItem(data);
  }

  @Get(':truckId/items')
  @ApiOperation({ summary: 'Get all menu items for food truck' })
  async getMenuItems(
    @Param('truckId') truckId: string,
    @CurrentTenant() tenant: any
  ) {
    return this.menuService.getMenuItems(truckId);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update menu item' })
  async updateMenuItem(
    @Param('id') id: string,
    @Body() data: UpdateMenuItemDto,
    @CurrentTenant() tenant: any
  ) {
    return this.menuService.updateMenuItem(id, data);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Delete menu item' })
  async deleteMenuItem(
    @Param('id') id: string,
    @CurrentTenant() tenant: any
  ) {
    return this.menuService.deleteMenuItem(id);
  }
}
