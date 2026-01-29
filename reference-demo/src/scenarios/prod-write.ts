/**
 * Scenario: Writing to Production
 * 
 * Demonstrates a REQUIRES_APPROVAL decision.
 * AI agents cannot write to production without human approval.
 */

import { PermissionRouter, type ExecuteResult } from '@permission-protocol/sdk';
import { writeRecord, type WriteResult, type WriteRecordInput } from '../mock-tools/db.js';
import { formatResult } from '../output.js';

export const SCENARIO_NAME = 'Writing to Production';
export const TOOL = 'db.write';
export const OPERATION = 'upsert_record';
export const EXPECTED_STATUS = 'REQUIRES_APPROVAL';

const input: WriteRecordInput = {
  table: 'users',
  record: {
    id: 'user_67890',
    name: 'Jane Doe',
    email: 'jane@example.com',
    role: 'admin',
  },
  environment: 'production',
};

export async function run(tenantId: string, agentId: string): Promise<void> {
  console.log(formatResult({
    scenarioName: SCENARIO_NAME,
    tool: TOOL,
    operation: OPERATION,
    phase: 'REQUESTING',
    input,
  }));

  const result: ExecuteResult<WriteResult> = await PermissionRouter.execute({
    tenantId,
    agentId,
    tool: 'db',
    operation: 'upsert_record',
    input,
    reversibility: 'PARTIALLY_REVERSIBLE',
    metadata: {
      targetTable: input.table,
      environment: input.environment,
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

  // If approved, we would execute the tool
  if (result.status === 'APPROVED') {
    const toolResult = await writeRecord(input);
    console.log(`  Tool executed: ${JSON.stringify(toolResult)}`);
  }
}
