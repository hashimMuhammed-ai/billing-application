export declare class TelegramService {
    private readonly logger;
    private get botToken();
    sendMessage(chatId: string | number, text: string): Promise<void>;
    sendDocument(chatId: string | number, documentBuffer: Buffer, filename: string, caption?: string): Promise<void>;
}
