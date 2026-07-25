export declare enum RouteType {
    BILL_CREATE = "BILL_CREATE",
    ADD_CUSTOMER = "ADD_CUSTOMER",
    EDIT_LAST = "EDIT_LAST",
    CANCEL_BILL = "CANCEL_BILL",
    SUMMARY = "SUMMARY",
    CUSTOMERS = "CUSTOMERS",
    FIND_CUSTOMER = "FIND_CUSTOMER",
    CONFIRM = "CONFIRM",
    REJECT = "REJECT",
    UNKNOWN = "UNKNOWN"
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
export declare class MessageRouterService {
    route(text: string): RouteResult;
    private getHelpMessage;
}
