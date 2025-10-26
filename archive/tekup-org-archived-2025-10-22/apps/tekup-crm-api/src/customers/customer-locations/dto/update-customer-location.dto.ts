import { PartialType } from '@nestjs/swagger';
import { CreateCustomerLocationDto } from './create-customer-location.dto';

export class UpdateCustomerLocationDto extends PartialType(CreateCustomerLocationDto) {}
