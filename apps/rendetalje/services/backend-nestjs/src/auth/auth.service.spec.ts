import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from './entities/user.entity';
import {
  createMockPrismaService,
  mockUser,
  MockPrismaService,
} from '../../test/test-utils';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: MockPrismaService;
  let jwtService: JwtService;

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock.jwt.token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '15m',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const createUserDto = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
        phone: '+45 11223344',
        role: UserRole.EMPLOYEE,
      };

      const hashedPassword = 'hashed_password';
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const createdUser = {
        id: 'new-user-123',
        email: createUserDto.email,
        name: createUserDto.name,
        phone: createUserDto.phone,
        passwordHash: hashedPassword,
        role: UserRole.EMPLOYEE,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.renosUser.findUnique.mockResolvedValue(null);
      prismaService.renosUser.create.mockResolvedValue(createdUser);

      const result = await service.register(createUserDto);

      expect(result.user.email).toBe(createUserDto.email);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.accessToken).toBe('mock.jwt.token');
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(
        createUserDto.password,
        10,
      );
      expect(prismaService.renosUser.create).toHaveBeenCalledWith({
        data: {
          email: createUserDto.email,
          name: createUserDto.name,
          phone: createUserDto.phone,
          passwordHash: hashedPassword,
          role: UserRole.EMPLOYEE,
          isActive: true,
        },
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      const createUserDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      prismaService.renosUser.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(createUserDto)).rejects.toThrow(
        'User with this email already exists',
      );
    });

    it('should default to EMPLOYEE role if not specified', async () => {
      const createUserDto = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };

      const hashedPassword = 'hashed_password';
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const createdUser = {
        ...mockUser,
        email: createUserDto.email,
        role: UserRole.EMPLOYEE,
      };

      prismaService.renosUser.findUnique.mockResolvedValue(null);
      prismaService.renosUser.create.mockResolvedValue(createdUser);

      await service.register(createUserDto);

      expect(prismaService.renosUser.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: UserRole.EMPLOYEE,
        }),
      });
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockedBcrypt.compare.mockResolvedValue(true as never);
      prismaService.renosUser.findUnique.mockResolvedValue(mockUser);
      prismaService.renosUser.update.mockResolvedValue({
        ...mockUser,
        lastLoginAt: new Date(),
      });

      const result = await service.login(loginDto);

      expect(result.user.email).toBe(mockUser.email);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.accessToken).toBe('mock.jwt.token');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
      expect(prismaService.renosUser.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      prismaService.renosUser.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException if account is inactive', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const inactiveUser = { ...mockUser, isActive: false };
      prismaService.renosUser.findUnique.mockResolvedValue(inactiveUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Account is deactivated',
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockedBcrypt.compare.mockResolvedValue(false as never);
      prismaService.renosUser.findUnique.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token for valid user', async () => {
      prismaService.renosUser.findUnique.mockResolvedValue(mockUser);

      const result = await service.refreshToken(mockUser.id);

      expect(result.accessToken).toBe('mock.jwt.token');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prismaService.renosUser.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken('nonexistent')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshToken('nonexistent')).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw UnauthorizedException if account is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      prismaService.renosUser.findUnique.mockResolvedValue(inactiveUser);

      await expect(service.refreshToken(mockUser.id)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshToken(mockUser.id)).rejects.toThrow(
        'Account is deactivated',
      );
    });
  });

  describe('validateUser', () => {
    it('should validate and return user without password', async () => {
      prismaService.renosUser.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser(mockUser.id);

      expect(result.email).toBe(mockUser.email);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prismaService.renosUser.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('nonexistent')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if account is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      prismaService.renosUser.findUnique.mockResolvedValue(inactiveUser);

      await expect(service.validateUser(mockUser.id)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getUserById', () => {
    it('should return user by id without password', async () => {
      prismaService.renosUser.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserById(mockUser.id);

      expect(result.email).toBe(mockUser.email);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaService.renosUser.findUnique.mockResolvedValue(null);

      await expect(service.getUserById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateDto = {
        name: 'Updated Name',
        phone: '+45 99887766',
      };

      const updatedUser = {
        ...mockUser,
        ...updateDto,
      };

      prismaService.renosUser.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(mockUser.id, updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(result.phone).toBe(updateDto.phone);
      expect(result).not.toHaveProperty('passwordHash');
      expect(prismaService.renosUser.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: updateDto,
      });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const oldPassword = 'oldPassword123';
      const newPassword = 'newPassword456';
      const newHashedPassword = 'new_hashed_password';

      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedBcrypt.hash.mockResolvedValue(newHashedPassword as never);
      prismaService.renosUser.findUnique.mockResolvedValue(mockUser);
      prismaService.renosUser.update.mockResolvedValue({
        ...mockUser,
        passwordHash: newHashedPassword,
      });

      await service.changePassword(mockUser.id, oldPassword, newPassword);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        oldPassword,
        mockUser.passwordHash,
      );
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(prismaService.renosUser.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { passwordHash: newHashedPassword },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaService.renosUser.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword('nonexistent', 'old', 'new'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if old password is incorrect', async () => {
      const oldPassword = 'wrongPassword';
      const newPassword = 'newPassword456';

      mockedBcrypt.compare.mockResolvedValue(false as never);
      prismaService.renosUser.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.changePassword(mockUser.id, oldPassword, newPassword),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.changePassword(mockUser.id, oldPassword, newPassword),
      ).rejects.toThrow('Current password is incorrect');
    });
  });
});
