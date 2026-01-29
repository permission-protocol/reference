/**
 * Scenario: Spending Money
 * 
 * Demonstrates a DENIED decision.
 * AI agents cannot charge customers without explicit authorization.
 */

import { PermissionRouter, type ExecuteResult } from '@permission-protocol/sdk';
import { chargeCustomer, type ChargeResult, type ChargeCustomerInput } from '../mock-tools/billing.js';
import { formatResult } from '../output.js';

export const SCENARIO_NAME = 'Spending Money';
export const TOOL = 'billing.charge';
export const OPERATION = 'charge_customer';
export const EXPECTED_STATUS = 'DENIED';

const input: ChargeCustomerInput = {
  customerId: 'cust_12345',
  amount: 499.99,
  currency: 'USD',
  description: 'Premium subscription renewal',
};

export async function run(tenantId: string, agentId: string): Promise<void> {
  console.log(formatResult({
    scenarioName: SCENARIO_NAME,
    tool: TOOL,
    operation: OPERATION,
    phase: 'REQUESTING',
    input,
  }));

  const result: ExecuteResult<ChargeResult> = await PermissionRouter.execute({
    tenantId,
    agentId,
    tool: 'billing',
    operation: 'charge_customer',
    input,
    reversibility: 'IRREVERSIBLE',
    metadata: {
      estimatedAmount: input.amount,
      currency: input.currency,
    },
  });

  // Assert status (demo asserts status only, not reason codes)
  const statusMatch = result.status === EXPECTED_STATUS;

  console.log(formatResult({
    scenarioName: SCENARIO_NAME,
    tool: TOOL,
    operation: OPERATION,
    phase: 'RESULT',
    result,
    expectedStatus: EXPECTED_STATUS,
    statusMatch,
  }));

  // If approved (unexpected), we would execute the tool
  if (result.status === 'APPROVED') {
    const toolResult = await chargeCustomer(input);
    console.log(`  Tool executed: ${JSON.stringify(toolResult)}`);
  }
}
