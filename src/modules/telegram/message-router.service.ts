import { Injectable } from '@nestjs/common';

export enum RouteType {
  BILL_CREATE = 'BILL_CREATE',
  ADD_CUSTOMER = 'ADD_CUSTOMER',
  EDIT_LAST = 'EDIT_LAST',
  CANCEL_BILL = 'CANCEL_BILL',
  SUMMARY = 'SUMMARY',
  CUSTOMERS = 'CUSTOMERS',
  FIND_CUSTOMER = 'FIND_CUSTOMER',
  CONFIRM = 'CONFIRM',
  REJECT = 'REJECT',
  UNKNOWN = 'UNKNOWN',
}

export interface RouteResult {
  type: RouteType;
  rawText: string;
  params?: {
    invoiceNo?: string;
    query?: string;
    customerPayload?: string;
  };
  errorMessage?: string;
}

@Injectable()
export class MessageRouterService {
  route(text: string): RouteResult {
    if (!text || typeof text !== 'string') {
      return {
        type: RouteType.UNKNOWN,
        rawText: text || '',
        errorMessage: this.getHelpMessage('Empty or invalid message received.'),
      };
    }

    const trimmedText = text.trim();
    const lowerText = trimmedText.toLowerCase();

    // 1. Check confirmation / rejection replies
    if (['yes', 'y', 'confirm', '/confirm'].includes(lowerText)) {
      return { type: RouteType.CONFIRM, rawText: trimmedText };
    }

    if (['no', 'n', 'reject', '/reject'].includes(lowerText)) {
      return { type: RouteType.REJECT, rawText: trimmedText };
    }

    // 2. Slash command routing
    if (trimmedText.startsWith('/')) {
      const firstLine = trimmedText.split('\n')[0].trim();
      const commandParts = firstLine.split(/\s+/);
      const command = commandParts[0].toLowerCase();
      const firstLineArgs = commandParts.slice(1).join(' ').trim();

      if (command.startsWith('/addcustomer')) {
        // Customer payload is everything after the command
        const customerPayload = trimmedText.replace(/^\/addcustomer\s*/i, '').trim();
        return {
          type: RouteType.ADD_CUSTOMER,
          rawText: trimmedText,
          params: { customerPayload: customerPayload || undefined },
        };
      }

      if (command === '/editlast') {
        return { type: RouteType.EDIT_LAST, rawText: trimmedText };
      }

      if (command === '/cancel') {
        // Extract invoice number from same line or remaining text
        const invoiceNo = firstLineArgs || trimmedText.split('\n').slice(1).join(' ').trim() || undefined;
        return {
          type: RouteType.CANCEL_BILL,
          rawText: trimmedText,
          params: { invoiceNo },
        };
      }

      if (command === '/summary') {
        return { type: RouteType.SUMMARY, rawText: trimmedText };
      }

      if (command === '/customers') {
        return { type: RouteType.CUSTOMERS, rawText: trimmedText };
      }

      if (command === '/find') {
        const query = firstLineArgs || trimmedText.split('\n').slice(1).join(' ').trim() || undefined;
        return {
          type: RouteType.FIND_CUSTOMER,
          rawText: trimmedText,
          params: { query },
        };
      }

      return {
        type: RouteType.UNKNOWN,
        rawText: trimmedText,
        errorMessage: this.getHelpMessage(`Unknown command '${command}'.`),
      };
    }

    // 3. Check 6-line bill creation format
    const lines = trimmedText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 6) {
      return {
        type: RouteType.BILL_CREATE,
        rawText: trimmedText,
      };
    }

    // 4. Anything else -> UNKNOWN
    return {
      type: RouteType.UNKNOWN,
      rawText: trimmedText,
      errorMessage: this.getHelpMessage(`Expected 6 lines for bill creation, got ${lines.length}.`),
    };
  }

  private getHelpMessage(prefix: string): string {
    return (
      `${prefix}\n\n` +
      `Message format not recognized.\n\n` +
      `To create a bill, send exactly 6 lines:\n` +
      `1. Vehicle No\n` +
      `2. E-Way Bill No\n` +
      `3. Customer Name\n` +
      `4. Dimension (e.g. 8*4)\n` +
      `5. Rate\n` +
      `6. Quantity\n\n` +
      `Or use available commands:\n` +
      `• /addcustomer (followed by 5 customer details lines)\n` +
      `• /editlast\n` +
      `• /cancel <invoiceNo>\n` +
      `• /summary\n` +
      `• /customers\n` +
      `• /find <name>`
    );
  }
}
