import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { ContentFactoryService } from './content-factory.service';
import { InternalAutomationGuard } from './internal-automation.guard';
import { NotionProjectsService } from './notion-projects.service';
import { WhatsAppPreviewService } from './whatsapp-preview.service';
import {
  contentAssetsSchema,
  contentBriefSchema,
} from './content-factory.types';

const notionProjectRequestSchema = z.object({
  brief: contentBriefSchema,
  assets: contentAssetsSchema,
});

const notificationRequestSchema = z.discriminatedUnion('eventType', [
  z.object({
    eventType: z.literal('project_ready'),
    title: z.string().min(1).max(180),
    duration: z.string().min(1).max(40),
    keyword: z.string().min(1).max(160),
    notionUrl: z.string().url(),
  }),
  z.object({
    eventType: z.literal('workflow_failed'),
    failureStage: z.string().min(1).max(100),
    errorCode: z.string().min(1).max(100),
  }),
]);

@Controller('internal')
@UseGuards(InternalAutomationGuard)
export class ContentFactoryController {
  constructor(
    private readonly contentFactory: ContentFactoryService,
    private readonly notionProjects: NotionProjectsService,
    private readonly whatsappPreview: WhatsAppPreviewService,
  ) {}

  @Post('content-factory/generate')
  async generate(@Body() body: unknown) {
    const parsed = contentBriefSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Content brief is invalid.',
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    return { data: await this.contentFactory.generate(parsed.data) };
  }

  @Post('notion/projects')
  async createNotionProject(@Body() body: unknown) {
    const parsed = notionProjectRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Notion project request is invalid.',
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    return { data: await this.notionProjects.createProject(parsed.data) };
  }

  @Post('whatsapp/preview')
  previewWhatsAppNotification(@Body() body: unknown) {
    const parsed = notificationRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'WhatsApp notification request is invalid.',
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    return {
      data: this.whatsappPreview.createPreview(
        parsed.data,
      ),
    };
  }
}
