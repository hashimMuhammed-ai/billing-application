import { MessageRouterService, RouteType } from './message-router.service';

describe('MessageRouterService', () => {
  let router: MessageRouterService;

  beforeEach(() => {
    router = new MessageRouterService();
  });

  describe('Confirmation & Rejection Replies', () => {
    it('should classify "yes", "y", "confirm", "/confirm" as CONFIRM', () => {
      ['yes', 'Y', 'confirm', 'CONFIRM', '/confirm'].forEach((text) => {
        const result = router.route(text);
        expect(result.type).toBe(RouteType.CONFIRM);
      });
    });

    it('should classify "no", "n", "reject", "/reject" as REJECT', () => {
      ['no', 'N', 'reject', 'REJECT', '/reject'].forEach((text) => {
        const result = router.route(text);
        expect(result.type).toBe(RouteType.REJECT);
      });
    });
  });

  describe('Slash Commands', () => {
    it('should classify /addcustomer and extract customer payload', () => {
      const msg = `/addcustomer
Moreland Ply&Boards
Manari P.O, Triveni, Muvattupuzha
32ACCFM3093K1Z7
Kerala
9847xxxxxx`;
      const result = router.route(msg);
      expect(result.type).toBe(RouteType.ADD_CUSTOMER);
      expect(result.params?.customerPayload).toContain('Moreland Ply&Boards');
      expect(result.params?.customerPayload).toContain('9847xxxxxx');
    });

    it('should classify /editlast', () => {
      const result = router.route('/editlast');
      expect(result.type).toBe(RouteType.EDIT_LAST);
    });

    it('should classify /cancel with or without invoice number', () => {
      const resultWithoutInv = router.route('/cancel');
      expect(resultWithoutInv.type).toBe(RouteType.CANCEL_BILL);
      expect(resultWithoutInv.params?.invoiceNo).toBeUndefined();

      const resultWithInv = router.route('/cancel AMT/2026-27/001');
      expect(resultWithInv.type).toBe(RouteType.CANCEL_BILL);
      expect(resultWithInv.params?.invoiceNo).toBe('AMT/2026-27/001');
    });

    it('should classify /summary', () => {
      const result = router.route('/summary');
      expect(result.type).toBe(RouteType.SUMMARY);
    });

    it('should classify /customers', () => {
      const result = router.route('/customers');
      expect(result.type).toBe(RouteType.CUSTOMERS);
    });

    it('should classify /find with or without query', () => {
      const resultWithoutQuery = router.route('/find');
      expect(resultWithoutQuery.type).toBe(RouteType.FIND_CUSTOMER);
      expect(resultWithoutQuery.params?.query).toBeUndefined();

      const resultWithQuery = router.route('/find Moreland');
      expect(resultWithQuery.type).toBe(RouteType.FIND_CUSTOMER);
      expect(resultWithQuery.params?.query).toBe('Moreland');
    });

    it('should return UNKNOWN for unrecognized slash command', () => {
      const result = router.route('/invalidcommand');
      expect(result.type).toBe(RouteType.UNKNOWN);
      expect(result.errorMessage).toContain("Unknown command '/invalidcommand'");
    });
  });

  describe('Bill Creation Routing (6 lines)', () => {
    it('should classify 6 non-empty lines as BILL_CREATE', () => {
      const billMsg = `KL01BJ3019
34AB1234C5678D1E2
Moreland
8*4
14.50
11609.52`;
      const result = router.route(billMsg);
      expect(result.type).toBe(RouteType.BILL_CREATE);
    });

    it('should return UNKNOWN for message with wrong line count', () => {
      const shortMsg = `KL01BJ3019
34AB1234C5678D1E2
Moreland
8*4`;
      const result = router.route(shortMsg);
      expect(result.type).toBe(RouteType.UNKNOWN);
      expect(result.errorMessage).toContain('Expected 6 lines for bill creation, got 4');
    });
  });

  describe('Edge cases', () => {
    it('should handle null/empty input gracefully', () => {
      const result = router.route('');
      expect(result.type).toBe(RouteType.UNKNOWN);
      expect(result.errorMessage).toContain('Empty or invalid message received');
    });
  });
});
