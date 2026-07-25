import { R2StorageService } from './r2-storage.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

jest.mock('@aws-sdk/client-s3');

describe('R2StorageService', () => {
  let service: R2StorageService;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    service = new R2StorageService();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return null if R2 credentials are unconfigured', async () => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;

    const result = await service.uploadBillPdf('AMT/2026-27/001', Buffer.from('pdf data'));
    expect(result).toBeNull();
  });

  it('should upload PDF buffer and return public URL when credentials are configured', async () => {
    process.env.R2_ACCOUNT_ID = 'test_account_id';
    process.env.R2_ACCESS_KEY_ID = 'test_access_key';
    process.env.R2_SECRET_ACCESS_KEY = 'test_secret_key';
    process.env.R2_BUCKET_NAME = 'billing-invoices';
    process.env.R2_PUBLIC_DOMAIN = 'https://pub-test.r2.dev';

    const mockSend = jest.fn().mockResolvedValue({});
    (S3Client as unknown as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    const result = await service.uploadBillPdf('AMT/2026-27/001', Buffer.from('pdf data'));

    expect(result).toBe('https://pub-test.r2.dev/bills/AMT_2026-27_001.pdf');
    expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
  });

  it('should return null gracefully if S3 upload fails', async () => {
    process.env.R2_ACCOUNT_ID = 'test_account_id';
    process.env.R2_ACCESS_KEY_ID = 'test_access_key';
    process.env.R2_SECRET_ACCESS_KEY = 'test_secret_key';

    const mockSend = jest.fn().mockRejectedValue(new Error('Network upload error'));
    (S3Client as unknown as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    const result = await service.uploadBillPdf('AMT/2026-27/001', Buffer.from('pdf data'));
    expect(result).toBeNull();
  });
});
