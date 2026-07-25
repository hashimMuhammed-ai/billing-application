export declare class R2StorageService {
    private readonly logger;
    private getS3Client;
    uploadBillPdf(invoiceNo: string, pdfBuffer: Buffer): Promise<string | null>;
}
