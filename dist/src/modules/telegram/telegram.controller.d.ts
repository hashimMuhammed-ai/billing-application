import { TelegramHandlerService } from './telegram-handler.service';
import type { TelegramUpdate } from './telegram.dto';
import type { RouteResult } from './message-router.service';
export declare class TelegramController {
    private readonly telegramHandlerService;
    constructor(telegramHandlerService: TelegramHandlerService);
    handleWebhook(update: TelegramUpdate, secretHeader?: string): Promise<{
        status: string;
        route?: RouteResult;
    }>;
}
