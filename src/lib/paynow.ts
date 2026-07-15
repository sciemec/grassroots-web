// src/lib/paynow.ts

const PAYNOW_API_URL = 'https://api.paynow.co.zw/v1';
const PAYNOW_INTEGRATION_ID = process.env.PAYNOW_INTEGRATION_ID || '';
const PAYNOW_INTEGRATION_KEY = process.env.PAYNOW_INTEGRATION_KEY || '';

interface PayNowPaymentRequest {
  amount: number;
  reference: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}

interface PayNowPaymentResponse {
  status: 'success' | 'error';
  reference: string;
  pollUrl: string;
  redirectUrl?: string;
  message?: string;
}

export class PayNowService {
  private integrationId: string;
  private integrationKey: string;
  private baseUrl: string;

  constructor() {
    this.integrationId = PAYNOW_INTEGRATION_ID;
    this.integrationKey = PAYNOW_INTEGRATION_KEY;
    this.baseUrl = PAYNOW_API_URL;
  }

  async initiatePayment(request: PayNowPaymentRequest): Promise<PayNowPaymentResponse> {
    const payload = {
      integration: {
        id: this.integrationId,
        key: this.integrationKey,
      },
      transaction: {
        amount: request.amount,
        reference: request.reference,
        description: request.description,
        customer: {
          name: request.customerName,
          email: request.customerEmail || '',
          phone: request.customerPhone || '',
        },
        resultUrls: {
          success: request.successUrl,
          cancel: request.cancelUrl,
          notify: request.notifyUrl,
        },
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/transaction/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('PayNow API error:', error);
        return {
          status: 'error',
          reference: '',
          pollUrl: '',
          message: `Payment initiation failed: ${error}`,
        };
      }

      const data = await response.json();
      
      return {
        status: data.status === 'success' ? 'success' : 'error',
        reference: data.reference || '',
        pollUrl: data.pollUrl || '',
        redirectUrl: data.redirectUrl,
        message: data.message,
      };
    } catch (error) {
      console.error('PayNow error:', error);
      return {
        status: 'error',
        reference: '',
        pollUrl: '',
        message: error instanceof Error ? error.message : 'Payment initiation failed',
      };
    }
  }

  async pollStatus(pollUrl: string): Promise<{ paid: boolean; status: string; reference: string }> {
    try {
      const response = await fetch(pollUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to poll status');
      }

      const data = await response.json();
      
      return {
        paid: data.status === 'paid' || data.paid === true,
        status: data.status || 'pending',
        reference: data.reference || '',
      };
    } catch (error) {
      console.error('Polling error:', error);
      return {
        paid: false,
        status: 'error',
        reference: '',
      };
    }
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    const expectedSignature = this.integrationKey;
    return signature === expectedSignature;
  }

  getPaymentMethods(): Array<{ id: string; name: string; icon: string }> {
    return [
      { id: 'ecocash', name: 'EcoCash', icon: '📱' },
      { id: 'innbucks', name: 'InnBucks', icon: '🏦' },
      { id: 'onemoney', name: 'OneMoney', icon: '📱' },
      { id: 'bank', name: 'Bank Transfer', icon: '🏛️' },
    ];
  }

  formatAmount(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  generateReference(prefix: string = 'CH'): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }
}

export const paynowService = new PayNowService();

export default paynowService;