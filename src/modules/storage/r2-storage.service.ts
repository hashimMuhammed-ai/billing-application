import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);

  private getS3Client(): S3Client | null {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey || accessKeyId === 'your_r2_access_key_id') {
      this.logger.warn('R2 storage credentials not fully configured in environment.');
      return null;
    }

    const endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

    return new S3Client({
      region: 'auto',
      endpoint: endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Uploads a PDF buffer to Cloudflare R2 storage under `bills/{sanitizedInvoiceNo}.pdf`.
   * Returns the public URL on success, or null if storage fails or credentials are unconfigured.
   */
  async uploadBillPdf(invoiceNo: string, pdfBuffer: Buffer): Promise<string | null> {
    const bucketName = process.env.R2_BUCKET_NAME || 'billing-invoices';
    const publicDomain = (process.env.R2_PUBLIC_DOMAIN || `https://${bucketName}.r2.dev`).replace(/\/$/, '');

    const sanitizedInvoiceNo = invoiceNo.replace(/[\/\\]/g, '_');
    const key = `bills/${sanitizedInvoiceNo}.pdf`;

    const s3Client = this.getS3Client();
    if (!s3Client) {
      this.logger.warn(`Skipping R2 upload for invoice ${invoiceNo}: R2 credentials unconfigured.`);
      return null;
    }

    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
      });

      await s3Client.send(command);
      const url = `${publicDomain}/${key}`;
      this.logger.log(`Successfully uploaded PDF for bill ${invoiceNo} to R2: ${url}`);
      return url;
    } catch (err) {
      this.logger.error(`Failed to upload PDF for bill ${invoiceNo} to R2: ${(err as Error).message}`, (err as Error).stack);
      return null;
    }
  }
}
