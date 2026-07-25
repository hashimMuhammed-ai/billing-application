import { Controller, Post, Body, Headers, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { TelegramHandlerService } from './telegram-handler.service';
import type { TelegramUpdate } from './telegram.dto';
import type { RouteResult } from './message-router.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramHandlerService: TelegramHandlerService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() update: TelegramUpdate,
    @Headers('x-telegram-bot-api-secret-token') secretHeader?: string,
  ): Promise<{ status: string; route?: RouteResult }> {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (expectedSecret && secretHeader !== expectedSecret) {
      throw new UnauthorizedException('Invalid Telegram webhook secret token');
    }

    return this.telegramHandlerService.handleUpdate(update);
  }
}
