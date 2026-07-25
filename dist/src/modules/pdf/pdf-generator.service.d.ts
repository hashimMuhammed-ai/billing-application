export interface PdfBillData {
    company: {
        name: string;
        address: string;
        phone: string;
        gstin: string;
        hsnCode: string;
        gstRate: number | {
            toNumber(): number;
        } | string;
        bankName: string;
        branch: string;
        ifsc: string;
        accountNo: string;
    };
    customer: {
        name: string;
        address: string;
        gstin?: string | null;
        state: string;
        phone?: string | null;
    };
    bill: {
        invoiceNo: string;
        vehicleNo: string;
        eWayBillNo: string;
        dimension: string;
        rate: number | {
            toNumber(): number;
        } | string;
        quantity: number | {
            toNumber(): number;
        } | string;
        amount: number | {
            toNumber(): number;
        } | string;
        cgst: number | {
            toNumber(): number;
        } | string;
        sgst: number | {
            toNumber(): number;
        } | string;
        roundOff: number | {
            toNumber(): number;
        } | string;
        grandTotal: number | {
            toNumber(): number;
        } | string;
        createdAt?: Date;
    };
}
export declare class PdfGeneratorService {
    private readonly logger;
    private templateCache;
    private loadTemplate;
    private toNumber;
    private formatDate;
    renderHtml(data: PdfBillData): string;
    generatePdf(data: PdfBillData): Promise<Buffer>;
}
