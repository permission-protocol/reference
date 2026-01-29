/**
 * Mock Billing Tool
 * 
 * Simulates a billing system. Does nothing but return success.
 * The Permission Protocol blocks unauthorized charges.
 */

export interface ChargeCustomerInput {
  customerId: string;
  amount: number;
  currency: string;
  description: string;
}

export interface ChargeResult {
  transactionId: string;
  success: boolean;
}

/**
 * Mock implementation of billing.charge
 * In reality, this would charge a customer's payment method.
 * 
 * Permission Protocol will DENY this action if not authorized.
 */
export async function chargeCustomer(input: ChargeCustomerInput): Promise<ChargeResult> {
  // This is a mock - in reality, this would call Stripe, etc.
  console.log(`  [MOCK] Would charge ${input.customerId} $${input.amount} ${input.currency}`);
  
  return {
    transactionId: `txn_mock_${Date.now()}`,
    success: true,
  };
}
