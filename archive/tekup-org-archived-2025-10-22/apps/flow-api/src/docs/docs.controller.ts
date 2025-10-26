import { Controller, Get, Header, NotFoundException } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

@Controller('docs')
export class DocsController {
  @Get('friday')
  @Header('Cache-Control', 'public, max-age=300')
  getFridayKnowledge() {
    const filePath = join(process.cwd(), 'docs', 'rendetalje-friday-knowledge_v1.md');
    try {
      const content = readFileSync(filePath, 'utf8');
      return { content };
    } catch {
      throw new NotFoundException({ error: 'doc_not_found' });
    }
  }
}
