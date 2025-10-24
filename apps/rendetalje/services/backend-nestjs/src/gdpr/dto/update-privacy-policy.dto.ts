import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePrivacyPolicyDto {
  @ApiProperty({ example: '2.0', description: 'Privacy policy version' })
  @IsString()
  version: string;

  @ApiProperty({ example: 'This is our privacy policy...', description: 'Privacy policy content' })
  @IsString()
  content: string;
}
