import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  private get botToken(): string | undefined {
    return process.env.TELEGRAM_BOT_TOKEN;
  }

  async sendMessage(chatId: string | number, text: string): Promise<void> {
    const token = this.botToken;
    if (!token) {
      this.logger.warn(`[TelegramService] TELEGRAM_BOT_TOKEN not configured. Message to chat ${chatId} suppressed:\n${text}`);
      return;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[TelegramService] sendMessage failed (${response.status}): ${errorText}`);
      }
    } catch (err) {
      this.logger.error(`[TelegramService] sendMessage error: ${(err as Error).message}`);
    }
  }

  async sendDocument(
    chatId: string | number,
    documentBuffer: Buffer,
    filename: string,
    caption?: string,
  ): Promise<void> {
    const token = this.botToken;
    if (!token) {
      this.logger.warn(`[TelegramService] TELEGRAM_BOT_TOKEN not configured. Document send to chat ${chatId} suppressed.`);
      return;
    }

    const url = `https://api.telegram.org/bot${token}/sendDocument`;
    try {
      const formData = new FormData();
      formData.append('chat_id', String(chatId));
      if (caption) {
        formData.append('caption', caption);
      }
      const blob = new Blob([new Uint8Array(documentBuffer)], { type: 'application/pdf' });
      formData.append('document', blob, filename);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[TelegramService] sendDocument failed (${response.status}): ${errorText}`);
      }
    } catch (err) {
      this.logger.error(`[TelegramService] sendDocument error: ${(err as Error).message}`);
    }
  }
}
