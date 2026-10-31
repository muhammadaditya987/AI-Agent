import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { environment } from '../config/env';

export interface WhatsAppNotificationInput {
  eventType: 'project_ready' | 'workflow_failed';
  title?: string;
  duration?: string;
  keyword?: string;
  notionUrl?: string;
  failureStage?: string;
  errorCode?: string;
}

@Injectable()
export class WhatsAppPreviewService {
  createPreview(input: WhatsAppNotificationInput): {
    mode: 'dry_run';
    sent: false;
    recipient: string;
    messagePreview: string;
  } {
    if (environment.WHATSAPP_DRY_RUN !== 'true') {
      throw new ServiceUnavailableException({
        code: 'WHATSAPP_LIVE_SENDING_DISABLED',
        message:
          'Live WhatsApp delivery is not implemented or enabled in Sprint 2.',
      });
    }

    const recipient = this.normalizeIndonesianNumber(
      environment.WHATSAPP_ALLOWED_RECIPIENT ?? '',
    );
    if (!recipient) {
      throw new ServiceUnavailableException({
        code: 'WHATSAPP_RECIPIENT_NOT_CONFIGURED',
        message: 'Set the single approved WhatsApp recipient in local env.',
      });
    }

    if (input.eventType === 'project_ready') {
      return {
        mode: 'dry_run',
        sent: false,
        recipient,
        messagePreview: [
          '✅ Project berhasil dibuat',
          `Judul: ${input.title ?? 'Tidak tersedia'}`,
          `Durasi: ${input.duration ?? 'Tidak tersedia'}`,
          `Keyword: ${input.keyword ?? 'Tidak tersedia'}`,
          `Notion: ${input.notionUrl ?? 'Tidak tersedia'}`,
          'Status: Ready Production',
        ].join('\n'),
      };
    }

    return {
      mode: 'dry_run',
      sent: false,
      recipient,
      messagePreview: [
        '⚠️ AI Content Factory gagal',
        `Tahap: ${input.failureStage ?? 'unknown'}`,
        `Kode: ${input.errorCode ?? 'WORKFLOW_FAILED'}`,
        'Tidak ada pesan sukses yang dikirim.',
      ].join('\n'),
    };
  }

  private normalizeIndonesianNumber(value: string): string | null {
    const digits = value.replace(/[^\d]/g, '');
    if (/^08\d{8,12}$/.test(digits)) {
      return `62${digits.slice(1)}`;
    }
    if (/^628\d{8,12}$/.test(digits)) {
      return digits;
    }
    return null;
  }
}
