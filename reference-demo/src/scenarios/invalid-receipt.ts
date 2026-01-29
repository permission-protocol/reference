/**
 * Scenario: Fail-Closed Behavior
 * 
 * Demonstrates that the SDK fails closed when it cannot verify authorization.
 * This is NOT a 4th status - it's an exception path that blocks execution.
 * 
 * When the Permission Protocol is unreachable, returns an error, or the
 * receipt cannot be verified, the SDK throws an exception and the action
 * MUST NOT proceed.
 * 
 * This shows: "No receipt = No deploy"
 */

import { PermissionRouter, PermissionProtocolError } from '@permission-protocol/sdk';
import { formatFailClosed } from '../output.js';

export const SCENARIO_NAME = 'Fail-Closed Behavior';
export const TOOL = 'test.invalid';
export const OPERATION = 'trigger_error';
// Note: This is NOT a status - it's an exception path
// The SDK's 3-state model is: APPROVED, REQUIRES_APPROVAL, DENIED
// Failures throw exceptions, they don't return a 4th status
export const EXPECTED_STATUS = 'EXCEPTION';

const input = {
  action: 'This will fail because the tool/operation is not registered',
};

export async function run(tenantId: string, agentId: string): Promise<void> {
  console.log(formatFailClosed({
    scenarioName: SCENARIO_NAME,
    tool: TOOL,
    operation: OPERATION,
    phase: 'REQUESTING',
  }));

  try {
    // This will fail - demonstrating fail-closed behavior
    await PermissionRouter.execute({
      tenantId,
      agentId,
      tool: 'test',
      operation: 'invalid_operation_that_does_not_exist',
      input,
      reversibility: 'UNKNOWN',
    });

    // If we get here, something unexpected happened
    console.log(formatFailClosed({
      scenarioName: SCENARIO_NAME,
      tool: TOOL,
      operation: OPERATION,
      phase: 'UNEXPECTED',
      message: 'Expected an error but got a response - this is a bug!',
    }));
    
    // Exit non-zero because this is unexpected
    process.exit(1);
  } catch (error) {
    // This is the EXPECTED path - fail closed
    const isPermissionError = error instanceof PermissionProtocolError;
    const errorCode = isPermissionError ? error.code : 'UNKNOWN';
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.log(formatFailClosed({
      scenarioName: SCENARIO_NAME,
      tool: TOOL,
      operation: OPERATION,
      phase: 'FAIL_CLOSED',
      errorCode,
      errorMessage,
    }));

    // Note: In a real agent, you would exit non-zero here.
    // For the demo, we continue to show the summary.
    // In production: process.exit(1);
  }
}
