import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsEnum, IsArray } from 'class-validator';
import { MCPCapabilities, MCPTransport, MCPServerConfig } from '../../../../inbox-ai/src/shared/types/mcp';

export class CreateMCPServerDto {
  @ApiProperty({ description: 'Server name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Server version', required: false })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({ description: 'Server description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Server capabilities' })
  @IsObject()
  capabilities: MCPCapabilities;

  @ApiProperty({ description: 'Transport configuration' })
  @IsObject()
  transport: MCPTransport;

  @ApiProperty({ description: 'Server configuration', required: false })
  @IsOptional()
  @IsObject()
  config?: MCPServerConfig;
}

export class UpdateMCPServerDto {
  @ApiProperty({ description: 'Server name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Server description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Server capabilities', required: false })
  @IsOptional()
  @IsObject()
  capabilities?: MCPCapabilities;

  @ApiProperty({ description: 'Server configuration', required: false })
  @IsOptional()
  @IsObject()
  config?: MCPServerConfig;
}

export class ExecuteToolDto {
  @ApiProperty({ description: 'Tool name to execute' })
  @IsString()
  toolName: string;

  @ApiProperty({ description: 'Tool arguments' })
  @IsObject()
  arguments: Record<string, any>;
}