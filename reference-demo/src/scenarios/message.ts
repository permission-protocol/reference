/**
 * Scenario: Messaging Customers
 * 
 * Demonstrates a REQUIRES_APPROVAL decision with REQUIRES_FOUNDER_VETO reason.
 * AI agents cannot message customers without founder approval.
 */

import { PermissionRouter, type ExecuteResult } from '@permission-protocol/sdk';
import { sendCampaignMessage, type SendResult, type SendCampaignInput } from '../mock-tools/messaging.js';
import { formatResult } from '../output.js';

export const SCENARIO_NAME = 'Messaging Customers';
export const TOOL = 'messaging.send';
export const OPERATION = 'send_campaign_message';
export const EXPECTED_STATUS = 'REQUIRES_APPROVAL';

const input: SendCampaignInput = {
  audienceId: 'segment_all_customers',
  subject: 'Important Update: New Feature Launch!',
  body: 'Dear valued customer, we are excited to announce...',
};

export async function run(tenantId: string, agentId: string): Promise<void> {
  console.log(formatResult({
    scenarioName: SCENARIO_NAME,
    tool: TOOL,
    operation: OPERATION,
    phase: 'REQUESTING',
    input,
  }));

  const result: ExecuteResult<SendResult> = await PermissionRouter.execute({
    tenantId,
    agentId,
    tool: 'messaging',
    operation: 'send_campaign_message',
    input,
    reversibility: 'IRREVERSIBLE',
    metadata: {
      audienceSize: 'all_customers',
      messageType: 'marketing',
    },
  });

  // Assert status (demo asserts status only, not reason codes)
  // Note: REQUIRES_FOUNDER_VETO maps to REQUIRES_APPROVAL in SDK's 3-state model
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

  // If approved, we would execute the tool
  if (result.status === 'APPROVED') {
    const toolResult = await sendCampaignMessage(input);
    console.log(`  Tool executed: ${JSON.stringify(toolResult)}`);
  }
}
