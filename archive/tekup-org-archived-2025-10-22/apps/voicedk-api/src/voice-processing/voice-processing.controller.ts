import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { VoiceProcessingService } from './voice-processing.service';
import { BusinessConfigService } from '../business-config/business-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProcessVoiceCommandDto } from './dto/process-voice-command.dto';
import { VoiceCommandResult } from './interfaces/voice-command-result.interface';
import { User } from '../auth/entities/user.entity';

@ApiTags('voice-processing')
@Controller('voice')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VoiceProcessingController {
  private readonly logger = new Logger(VoiceProcessingController.name);

  constructor(
    private readonly voiceProcessingService: VoiceProcessingService,
    private readonly businessConfigService: BusinessConfigService,
  ) {}

  @Post('process')
  @ApiOperation({ 
    summary: 'Process voice command',
    description: 'Upload audio file and process Danish voice command with business context'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 200, 
    description: 'Voice command processed successfully',
    type: 'VoiceCommandResult'
  })
  @ApiResponse({ status: 400, description: 'Invalid audio file or business config' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(FileInterceptor('audio', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Only audio files are allowed'), false);
      }
    },
  }))
  async processVoiceCommand(
    @UploadedFile() audioFile: Express.Multer.File,
    @Body() processDto: ProcessVoiceCommandDto,
    @CurrentUser() user: User
  ): Promise<VoiceCommandResult> {
    
    if (!audioFile) {
      throw new BadRequestException('Audio file is required');
    }

    this.logger.log(`Processing voice command for user ${user.id}, business ${processDto.businessId}`);

    // Get business configuration
    const businessConfig = await this.businessConfigService.findByIdAndUser(
      processDto.businessId, 
      user.id
    );

    if (!businessConfig) {
      throw new BadRequestException('Business configuration not found');
    }

    // Process the voice command
    return this.voiceProcessingService.processVoiceCommand(
      audioFile.buffer,
      businessConfig,
      user.id
    );
  }

  @Post('process-text')
  @ApiOperation({ 
    summary: 'Process text command',
    description: 'Process text-based command (for testing or accessibility)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Text command processed successfully' 
  })
  async processTextCommand(
    @Body() processDto: ProcessVoiceCommandDto & { text: string },
    @CurrentUser() user: User
  ): Promise<VoiceCommandResult> {
    
    this.logger.log(`Processing text command for user ${user.id}: "${processDto.text}"`);

    // Get business configuration
    const businessConfig = await this.businessConfigService.findByIdAndUser(
      processDto.businessId,
      user.id
    );

    if (!businessConfig) {
      throw new BadRequestException('Business configuration not found');
    }

    // Convert text to audio buffer simulation for consistent processing
    const textBuffer = Buffer.from(processDto.text, 'utf-8');
    
    return this.voiceProcessingService.processVoiceCommand(
      textBuffer,
      businessConfig,
      user.id
    );
  }
}