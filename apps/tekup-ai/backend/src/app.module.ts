import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { AiModule } from "./ai/ai.module";
import { AuthModule } from "./auth/auth.module";
import configuration from "./config/configuration";
import { ConversationsModule } from "./conversations/conversations.module";
import { DatabaseModule } from "./database/database.module";
import { McpModule } from "./mcp/mcp.module";
import { MemoriesModule } from "./memories/memories.module";
import { TrpcModule } from "./trpc/trpc.module";
import { UsersModule } from "./users/users.module";
import { WebsocketModule } from "./websocket/websocket.module";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [".env.local", ".env"],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute
      },
    ]),

    // Core Modules
    DatabaseModule,
    AuthModule,
    UsersModule,

    // Feature Modules
    AiModule,
    McpModule,
    ConversationsModule,
    MemoriesModule,
    TrpcModule,

    // Real-time Communication
    WebsocketModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
