import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { environment } from '../config/env';
import type { ContentAssets, ContentBrief } from './content-factory.types';

interface NotionCreatePageResponse {
  id?: string;
  url?: string;
}

type NotionBlock = Record<string, unknown>;

@Injectable()
export class NotionProjectsService {
  async createProject(input: {
    brief: ContentBrief;
    assets: ContentAssets;
  }): Promise<{ pageId: string; pageUrl: string }> {
    if (!environment.NOTION_API_KEY || !environment.NOTION_PARENT_PAGE_ID) {
      throw new ServiceUnavailableException({
        code: 'NOTION_NOT_CONFIGURED',
        message: 'Notion integration is not configured.',
      });
    }

    const title = input.assets.title.slice(0, 180);
    let response: Response;

    try {
      response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${environment.NOTION_API_KEY}`,
          'Notion-Version': environment.NOTION_API_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent: {
            type: 'page_id',
            page_id: environment.NOTION_PARENT_PAGE_ID,
          },
          properties: {
            title: {
              type: 'title',
              title: [{ type: 'text', text: { content: title } }],
            },
          },
          children: this.toNotionBlocks(input.brief, input.assets),
        }),
        signal: AbortSignal.timeout(environment.NOTION_TIMEOUT_MS),
      });
    } catch {
      throw new ServiceUnavailableException({
        code: 'NOTION_UNAVAILABLE',
        message: 'Notion could not be reached. The project was not saved.',
      });
    }

    if (!response.ok) {
      throw new BadGatewayException({
        code: 'NOTION_CREATE_FAILED',
        message:
          'Notion did not create the project. Check integration access to the configured parent page.',
      });
    }

    let page: NotionCreatePageResponse;
    try {
      page = (await response.json()) as NotionCreatePageResponse;
    } catch {
      throw new BadGatewayException({
        code: 'NOTION_INVALID_RESPONSE',
        message: 'Notion returned an invalid page response.',
      });
    }

    if (!page.id || !page.url) {
      throw new BadGatewayException({
        code: 'NOTION_INVALID_PAGE',
        message: 'Notion response did not contain a page ID and URL.',
      });
    }

    return { pageId: page.id, pageUrl: page.url };
  }

  private toNotionBlocks(
    brief: ContentBrief,
    assets: ContentAssets,
  ): NotionBlock[] {
    const sections: Array<[string, string]> = [
      ['Keyword', brief.keyword],
      ['Target usia', brief.targetAge],
      ['Bahasa', brief.language],
      ['Ide lagu', assets.songIdea],
      ['Lirik', assets.lyrics],
      ['Prompt Suno', assets.sunoPrompt],
      ['Prompt Google Flow', assets.googleFlowPrompt],
      ['Prompt thumbnail', assets.thumbnailPrompt],
      ['Deskripsi YouTube', assets.youtubeDescription],
      ['SEO keywords', assets.seoKeywords.join(', ')],
      ['Hashtags', assets.hashtags.join(' ')],
      ['Estimasi durasi', assets.estimatedDuration],
      ['Status', 'Ready Production'],
    ];

    return sections.flatMap(([heading, content]) => [
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: heading } }],
        },
      },
      ...this.toParagraphBlocks(content),
    ]);
  }

  private toParagraphBlocks(content: string): NotionBlock[] {
    const chunks: string[] = [];
    for (let start = 0; start < content.length; start += 1800) {
      chunks.push(content.slice(start, start + 1800));
    }

    return chunks.map((chunk) => ({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ type: 'text', text: { content: chunk } }],
      },
    }));
  }
}
