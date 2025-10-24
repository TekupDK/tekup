import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { SupabaseService } from "../supabase/supabase.service";
import { UnauthorizedException, BadRequestException, ConflictException } from "@nestjs/common";
import { UserRole } from "../common/enums/user-role.enum";

describe("AuthService", () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let supabaseService: SupabaseService;

  const mockUserId = "user-123";
  const mockEmail = "test@example.com";
  const mockOrganizationId = "org-123";
  const mockPassword = "password123";

  const mockUser = {
    id: mockUserId,
    organization_id: mockOrganizationId,
    email: mockEmail,
    name: "John Doe",
    role: UserRole.ADMIN,
    phone: "+45 12345678",
    is_active: true,
    avatar_url: null,
    last_login_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockAuthUser = {
    user: {
      id: mockUserId,
      email: mockEmail,
      email_confirm_at: new Date().toISOString(),
      user_metadata: {
        name: mockUser.name,
        role: mockUser.role,
        organization_id: mockOrganizationId,
      },
    },
    session: {
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
    },
  };

  const mockSupabaseResponse = (data: any = null, error: any = null) => ({
    data,
    error,
  });

  const mockSupabaseQuery = () => {
    const query = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };
    return query;
  };

  beforeEach(async () => {
    const mockSupabaseClient = {
      ...mockSupabaseQuery(),
      auth: {
        signInWithPassword: jest.fn(),
        resetPasswordForEmail: jest.fn(),
        updateUser: jest.fn(),
        admin: {
          getUserByEmail: jest.fn(),
          createUser: jest.fn(),
          deleteUser: jest.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue("signed-jwt-token"),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "FRONTEND_URL") return "http://localhost:3000";
              return null;
            }),
          },
        },
        {
          provide: SupabaseService,
          useValue: {
            client: mockSupabaseClient,
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("register", () => {
    const createUserDto = {
      email: mockEmail,
      password: mockPassword,
      name: "John Doe",
      role: UserRole.ADMIN,
      organizationId: mockOrganizationId,
      phone: "+45 12345678",
    };

    it("should register a new user successfully", async () => {
      const mockClient = supabaseService.client as any;

      // Mock user doesn't exist
      mockClient.auth.admin.getUserByEmail.mockResolvedValueOnce(
        mockSupabaseResponse({ user: null })
      );

      // Mock auth user creation
      mockClient.auth.admin.createUser.mockResolvedValueOnce(
        mockSupabaseResponse(mockAuthUser)
      );

      // Mock database user creation
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(mockUser)
      );

      const result = await service.register(createUserDto);

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("accessToken");
      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBe("signed-jwt-token");
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUserId,
        email: mockEmail,
        role: UserRole.ADMIN,
        organizationId: mockOrganizationId,
      });
    });

    it("should throw ConflictException if user already exists", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.auth.admin.getUserByEmail.mockResolvedValueOnce(
        mockSupabaseResponse({ user: mockAuthUser.user })
      );

      await expect(service.register(createUserDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.register(createUserDto)).rejects.toThrow(
        "User with this email already exists"
      );
    });

    it("should throw BadRequestException if auth user creation fails", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.auth.admin.getUserByEmail.mockResolvedValueOnce(
        mockSupabaseResponse({ user: null })
      );

      mockClient.auth.admin.createUser.mockResolvedValueOnce(
        mockSupabaseResponse(null, { message: "Auth error" })
      );

      await expect(service.register(createUserDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it("should cleanup auth user if database insert fails", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.auth.admin.getUserByEmail.mockResolvedValueOnce(
        mockSupabaseResponse({ user: null })
      );

      mockClient.auth.admin.createUser.mockResolvedValueOnce(
        mockSupabaseResponse(mockAuthUser)
      );

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(null, { message: "Database error" })
      );

      await expect(service.register(createUserDto)).rejects.toThrow(
        BadRequestException
      );

      expect(mockClient.auth.admin.deleteUser).toHaveBeenCalledWith(
        mockAuthUser.user.id
      );
    });
  });

  describe("login", () => {
    const loginDto = {
      email: mockEmail,
      password: mockPassword,
    };

    it("should login user successfully", async () => {
      const mockClient = supabaseService.client as any;

      // Mock auth login
      mockClient.auth.signInWithPassword.mockResolvedValueOnce(
        mockSupabaseResponse(mockAuthUser)
      );

      // Mock get user profile
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(mockUser)
      );

      // Mock update last login
      mockClient.mockResolvedValueOnce(mockSupabaseResponse(null));

      const result = await service.login(loginDto);

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("accessToken");
      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBe("signed-jwt-token");
      expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: mockEmail,
        password: mockPassword,
      });
    });

    it("should throw UnauthorizedException for invalid credentials", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.auth.signInWithPassword.mockResolvedValueOnce(
        mockSupabaseResponse(null, { message: "Invalid credentials" })
      );

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        "Invalid credentials"
      );
    });

    it("should throw UnauthorizedException if user profile not found", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.auth.signInWithPassword.mockResolvedValueOnce(
        mockSupabaseResponse(mockAuthUser)
      );

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(null, { message: "Not found" })
      );

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        "User profile not found"
      );
    });

    it("should throw UnauthorizedException for deactivated user", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.auth.signInWithPassword.mockResolvedValueOnce(
        mockSupabaseResponse(mockAuthUser)
      );

      const deactivatedUser = { ...mockUser, is_active: false };
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(deactivatedUser)
      );

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        "User account is deactivated"
      );
    });

    it("should update last login timestamp", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.auth.signInWithPassword.mockResolvedValueOnce(
        mockSupabaseResponse(mockAuthUser)
      );

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(mockUser)
      );

      mockClient.mockResolvedValueOnce(mockSupabaseResponse(null));

      await service.login(loginDto);

      expect(mockClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          last_login_at: expect.any(String),
        })
      );
    });
  });

  describe("refreshToken", () => {
    it("should refresh token for active user", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(mockUser)
      );

      const result = await service.refreshToken(mockUserId);

      expect(result).toHaveProperty("accessToken");
      expect(result.accessToken).toBe("signed-jwt-token");
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUserId,
        email: mockEmail,
        role: UserRole.ADMIN,
        organizationId: mockOrganizationId,
      });
    });

    it("should throw UnauthorizedException if user not found", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(null, { message: "Not found" })
      );

      await expect(service.refreshToken(mockUserId)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should throw UnauthorizedException for deactivated user", async () => {
      const mockClient = supabaseService.client as any;

      const deactivatedUser = { ...mockUser, is_active: false };
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(deactivatedUser)
      );

      await expect(service.refreshToken(mockUserId)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe("requestPasswordReset", () => {
    it("should send password reset email successfully", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.auth.resetPasswordForEmail.mockResolvedValueOnce(
        mockSupabaseResponse(null)
      );

      const result = await service.requestPasswordReset(mockEmail);

      expect(result).toEqual({
        message: "Password reset email sent successfully",
      });
      expect(mockClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        mockEmail,
        {
          redirectTo: "http://localhost:3000/auth/reset-password",
        }
      );
    });

    it("should throw BadRequestException on error", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.auth.resetPasswordForEmail.mockResolvedValueOnce(
        mockSupabaseResponse(null, { message: "Email service error" })
      );

      await expect(service.requestPasswordReset(mockEmail)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("resetPassword", () => {
    const resetPasswordDto = {
      token: "reset-token",
      password: "newPassword123",
    };

    it("should reset password successfully", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.auth.updateUser.mockResolvedValueOnce(
        mockSupabaseResponse(null)
      );

      const result = await service.resetPassword(resetPasswordDto);

      expect(result).toEqual({ message: "Password reset successfully" });
      expect(mockClient.auth.updateUser).toHaveBeenCalledWith({
        password: resetPasswordDto.password,
      });
    });

    it("should throw BadRequestException on error", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.auth.updateUser.mockResolvedValueOnce(
        mockSupabaseResponse(null, { message: "Update error" })
      );

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("changePassword", () => {
    const changePasswordDto = {
      currentPassword: "oldPassword123",
      newPassword: "newPassword123",
    };

    it("should change password successfully", async () => {
      const mockClient = supabaseService.client as any;

      // Mock get user email
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse({ email: mockEmail })
      );

      // Mock verify current password
      mockClient.auth.signInWithPassword.mockResolvedValueOnce(
        mockSupabaseResponse(mockAuthUser)
      );

      // Mock update password
      mockClient.auth.updateUser.mockResolvedValueOnce(
        mockSupabaseResponse(null)
      );

      const result = await service.changePassword(mockUserId, changePasswordDto);

      expect(result).toEqual({ message: "Password changed successfully" });
      expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: mockEmail,
        password: changePasswordDto.currentPassword,
      });
      expect(mockClient.auth.updateUser).toHaveBeenCalledWith({
        password: changePasswordDto.newPassword,
      });
    });

    it("should throw UnauthorizedException if user not found", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.single.mockResolvedValueOnce(mockSupabaseResponse(null));

      await expect(
        service.changePassword(mockUserId, changePasswordDto)
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if current password is incorrect", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse({ email: mockEmail })
      );

      mockClient.auth.signInWithPassword.mockResolvedValueOnce(
        mockSupabaseResponse(null, { message: "Invalid credentials" })
      );

      await expect(
        service.changePassword(mockUserId, changePasswordDto)
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.changePassword(mockUserId, changePasswordDto)
      ).rejects.toThrow("Current password is incorrect");
    });

    it("should throw BadRequestException if password update fails", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse({ email: mockEmail })
      );

      mockClient.auth.signInWithPassword.mockResolvedValueOnce(
        mockSupabaseResponse(mockAuthUser)
      );

      mockClient.auth.updateUser.mockResolvedValueOnce(
        mockSupabaseResponse(null, { message: "Update failed" })
      );

      await expect(
        service.changePassword(mockUserId, changePasswordDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("validateUser", () => {
    it("should validate active user successfully", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(mockUser)
      );

      const result = await service.validateUser(mockUserId);

      expect(result).toEqual(mockUser);
    });

    it("should throw UnauthorizedException if user not found", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(null, { message: "Not found" })
      );

      await expect(service.validateUser(mockUserId)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should throw UnauthorizedException for deactivated user", async () => {
      const mockClient = supabaseService.client as any;

      const deactivatedUser = { ...mockUser, is_active: false };
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(deactivatedUser)
      );

      await expect(service.validateUser(mockUserId)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe("updateProfile", () => {
    const updateData = {
      name: "Jane Doe",
      phone: "+45 87654321",
    };

    it("should update user profile successfully", async () => {
      const mockClient = supabaseService.client as any;

      const updatedUser = { ...mockUser, ...updateData };
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(updatedUser)
      );

      const result = await service.updateProfile(mockUserId, updateData);

      expect(result).toEqual(updatedUser);
      expect(mockClient.update).toHaveBeenCalled();
    });

    it("should not allow updating restricted fields", async () => {
      const mockClient = supabaseService.client as any;

      const restrictedUpdate = {
        id: "new-id",
        organization_id: "new-org",
        role: UserRole.OWNER,
        name: "New Name",
      };

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(mockUser)
      );

      await service.updateProfile(mockUserId, restrictedUpdate);

      // Verify that restricted fields are not in the update call
      const updateCall = mockClient.update.mock.calls[0][0];
      expect(updateCall).not.toHaveProperty("id");
      expect(updateCall).not.toHaveProperty("organization_id");
      expect(updateCall).not.toHaveProperty("role");
      expect(updateCall).toHaveProperty("name");
    });

    it("should throw BadRequestException on update error", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(null, { message: "Update error" })
      );

      await expect(
        service.updateProfile(mockUserId, updateData)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("deactivateUser", () => {
    it("should deactivate user successfully", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.mockResolvedValueOnce(mockSupabaseResponse(null));

      const result = await service.deactivateUser(mockUserId);

      expect(result).toEqual({ message: "User deactivated successfully" });
      expect(mockClient.update).toHaveBeenCalledWith({ is_active: false });
      expect(mockClient.eq).toHaveBeenCalledWith("id", mockUserId);
    });

    it("should throw BadRequestException on error", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.mockResolvedValueOnce(
        mockSupabaseResponse(null, { message: "Deactivation error" })
      );

      await expect(service.deactivateUser(mockUserId)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("activateUser", () => {
    it("should activate user successfully", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.mockResolvedValueOnce(mockSupabaseResponse(null));

      const result = await service.activateUser(mockUserId);

      expect(result).toEqual({ message: "User activated successfully" });
      expect(mockClient.update).toHaveBeenCalledWith({ is_active: true });
      expect(mockClient.eq).toHaveBeenCalledWith("id", mockUserId);
    });

    it("should throw BadRequestException on error", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.mockResolvedValueOnce(
        mockSupabaseResponse(null, { message: "Activation error" })
      );

      await expect(service.activateUser(mockUserId)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("getUsersByOrganization", () => {
    it("should get all users for organization", async () => {
      const mockClient = supabaseService.client as any;

      const mockUsers = [mockUser, { ...mockUser, id: "user-456" }];
      mockClient.mockResolvedValueOnce(mockSupabaseResponse(mockUsers));

      const result = await service.getUsersByOrganization(mockOrganizationId);

      expect(result).toEqual(mockUsers);
      expect(mockClient.eq).toHaveBeenCalledWith(
        "organization_id",
        mockOrganizationId
      );
    });

    it("should filter by role when specified", async () => {
      const mockClient = supabaseService.client as any;

      const mockUsers = [mockUser];
      mockClient.mockResolvedValueOnce(mockSupabaseResponse(mockUsers));

      const result = await service.getUsersByOrganization(
        mockOrganizationId,
        UserRole.ADMIN
      );

      expect(result).toEqual(mockUsers);
      expect(mockClient.eq).toHaveBeenCalledWith("role", UserRole.ADMIN);
    });

    it("should return empty array if no users found", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.mockResolvedValueOnce(mockSupabaseResponse(null));

      const result = await service.getUsersByOrganization(mockOrganizationId);

      expect(result).toEqual([]);
    });

    it("should throw BadRequestException on database error", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.mockResolvedValueOnce(
        mockSupabaseResponse(null, { message: "Database error" })
      );

      await expect(
        service.getUsersByOrganization(mockOrganizationId)
      ).rejects.toThrow(BadRequestException);
    });
  });
});
