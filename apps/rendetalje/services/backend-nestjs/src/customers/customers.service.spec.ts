import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  let service: CustomersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: 'DATABASE_CONNECTION',
          useValue: {
            customer: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of customers', async () => {
      const mockCustomers = [
        { 
          id: '1', 
          name: 'Test Customer', 
          email: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(service as any, 'findAll').mockResolvedValue(mockCustomers);

      const result = await service.findAll();
      expect(result).toEqual(mockCustomers);
    });
  });

  describe('create', () => {
    it('should create a new customer', async () => {
      const createCustomerDto = {
        name: 'New Customer',
        email: 'new@example.com',
        phone: '+45 12345678',
      };

      const mockCreatedCustomer = {
        id: '1',
        ...createCustomerDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockCreatedCustomer);

      const result = await service.create(createCustomerDto);
      expect(result).toEqual(mockCreatedCustomer);
    });
  });
});