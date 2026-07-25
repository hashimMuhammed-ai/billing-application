"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var R2StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.R2StorageService = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
let R2StorageService = R2StorageService_1 = class R2StorageService {
    logger = new common_1.Logger(R2StorageService_1.name);
    getS3Client() {
        const accountId = process.env.R2_ACCOUNT_ID;
        const accessKeyId = process.env.R2_ACCESS_KEY_ID;
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
        if (!accountId || !accessKeyId || !secretAccessKey || accessKeyId === 'your_r2_access_key_id') {
            this.logger.warn('R2 storage credentials not fully configured in environment.');
            return null;
        }
        const endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;
        return new client_s3_1.S3Client({
            region: 'auto',
            endpoint: endpoint,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }
    async uploadBillPdf(invoiceNo, pdfBuffer) {
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
            const command = new client_s3_1.PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: pdfBuffer,
                ContentType: 'application/pdf',
            });
            await s3Client.send(command);
            const url = `${publicDomain}/${key}`;
            this.logger.log(`Successfully uploaded PDF for bill ${invoiceNo} to R2: ${url}`);
            return url;
        }
        catch (err) {
            this.logger.error(`Failed to upload PDF for bill ${invoiceNo} to R2: ${err.message}`, err.stack);
            return null;
        }
    }
};
exports.R2StorageService = R2StorageService;
exports.R2StorageService = R2StorageService = R2StorageService_1 = __decorate([
    (0, common_1.Injectable)()
], R2StorageService);
//# sourceMappingURL=r2-storage.service.js.map