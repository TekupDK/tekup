import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// TODO: Create User entity
// import { User } from './entities/user.entity';

// TODO: Implement AuthService, AuthController, JwtStrategy, etc.
// import { AuthService } from './auth.service';
// import { AuthController } from './auth.controller';
// import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    // TypeOrmModule.forFeature([User]), // TODO: Create entity
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'voicedk-secret-key',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [
    // AuthController, // TODO: Create this
  ],
  providers: [
    // AuthService, // TODO: Create this
    // JwtStrategy, // TODO: Create this
  ],
  exports: [
    // AuthService, // TODO: Create this
  ],
})
export class AuthModule {}
