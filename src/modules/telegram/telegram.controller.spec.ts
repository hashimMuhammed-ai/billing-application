import { Test, TestingModule } from '@nestjs/testing';
import { TelegramController } from './telegram.controller';
import { TelegramHandlerService } from './telegram-handler.service';
import { RouteType } from './message-router.service';
import { UnauthorizedException } from '@nestjs/common';
import { TelegramUpdate } from './telegram.dto';

describe('TelegramController', () => {
  let controller: TelegramController;
  let mockHandlerService: Partial<TelegramHandlerService>;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    delete process.env.TELEGRAM_WEBHOOK_SECRET;

    mockHandlerService = {
      handleUpdate: jest.fn().mockImplementation(async (update: TelegramUpdate) => {
        if (!update?.message?.text) {
          return { status: 'ok' };
        }
        return { status: 'ok', route: { type: RouteType.SUMMARY, rawText: update.message.text } };
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelegramController],
      providers: [
        {
          provide: TelegramHandlerService,
          useValue: mockHandlerService,
        },
      ],
    }).compile();

    controller = module.get<TelegramController>(TelegramController);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should process a valid update message and return status ok with route', async () => {
    const update: TelegramUpdate = {
      update_id: 100,
      message: {
        message_id: 1,
        chat: { id: 12345, type: 'private' },
        date: Date.now(),
        text: '/summary',
      },
    };

    const res = await controller.handleWebhook(update);
    expect(res.status).toBe('ok');
    expect(res.route?.type).toBe(RouteType.SUMMARY);
    expect(mockHandlerService.handleUpdate).toHaveBeenCalledWith(update);
  });

  it('should return status ok when update has no text message', async () => {
    const update: TelegramUpdate = {
      update_id: 101,
      message: {
        message_id: 2,
        chat: { id: 12345, type: 'private' },
        date: Date.now(),
      },
    };

    const res = await controller.handleWebhook(update);
    expect(res.status).toBe('ok');
  });

  it('should enforce TELEGRAM_WEBHOOK_SECRET header validation if set', async () => {
    process.env.TELEGRAM_WEBHOOK_SECRET = 'mysecretkey123';

    const update: TelegramUpdate = {
      update_id: 102,
      message: {
        message_id: 3,
        chat: { id: 12345, type: 'private' },
        date: Date.now(),
        text: '/summary',
      },
    };

    await expect(controller.handleWebhook(update, 'wrongsecret')).rejects.toThrow(UnauthorizedException);

    const validRes = await controller.handleWebhook(update, 'mysecretkey123');
    expect(validRes.status).toBe('ok');
    expect(validRes.route?.type).toBe(RouteType.SUMMARY);
  });
});
