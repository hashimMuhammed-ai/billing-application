import { TelegramService } from './telegram.service';

describe('TelegramService', () => {
  let service: TelegramService;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    service = new TelegramService();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should suppress network calls gracefully when TELEGRAM_BOT_TOKEN is not set', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    await expect(service.sendMessage(12345, 'Test message')).resolves.not.toThrow();
    await expect(service.sendDocument(12345, Buffer.from('test pdf'), 'test.pdf')).resolves.not.toThrow();
  });

  it('should attempt fetch call when TELEGRAM_BOT_TOKEN is set', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';

    const globalFetch = global.fetch;
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    global.fetch = mockFetch;

    try {
      await service.sendMessage(999, 'Hello Bot');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toContain('https://api.telegram.org/bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11/sendMessage');

      await service.sendDocument(999, Buffer.from('PDF content'), 'invoice.pdf', 'Caption');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[1][0]).toContain('https://api.telegram.org/bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11/sendDocument');
    } finally {
      global.fetch = globalFetch;
    }
  });
});
