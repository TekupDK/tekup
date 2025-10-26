import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '@tekup/auth';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  create(@Body() createContactDto: CreateContactDto) {
    return this.contactsService.create(createContactDto);
  }

  @Get()
  findAll() {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.contactsService.findAll('tenant-id');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.contactsService.findOne(id, 'tenant-id');
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.contactsService.update(id, 'tenant-id', updateContactDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.contactsService.remove(id, 'tenant-id');
  }
}