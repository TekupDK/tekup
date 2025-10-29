import { PrismaClient } from "@prisma/client";
import { PrismaService as BasePrismaService } from "./prisma.service";

// Augment PrismaService with all PrismaClient properties
declare module "./prisma.service" {
  interface PrismaService extends PrismaClient {
    // This tells TypeScript that PrismaService has all PrismaClient properties
  }
}
