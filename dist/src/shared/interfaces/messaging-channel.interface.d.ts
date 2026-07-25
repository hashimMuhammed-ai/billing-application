export interface IncomingMessage {
    channelId: string;
    senderId: string;
    senderName?: string;
    text: string;
    rawPayload: any;
}
export interface MessagingChannel {
    sendMessage(channelId: string, text: string): Promise<void>;
    sendDocument(channelId: string, document: Buffer, filename: string, caption?: string): Promise<void>;
}
