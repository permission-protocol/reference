#!/usr/bin/env node
/**
 * Permission Protocol Reference Demo
 * 
 * Demonstrates authority boundaries for AI agents:
 * - DENIED: Spending money
 * - REQUIRES_APPROVAL: Writing to production
 * - REQUIRES_APPROVAL (Founder Veto): Messaging customers
 * - ERROR: Invalid receipt (fail-closed)
 * - TRUST TESTS: Manual real-world sanity checks
 * 
 * Usage:
 *   pnpm demo:run --scenario spend
 *   pnpm demo:run --scenario prod
 *   pnpm demo:run --scenario message
 *   pnpm demo:run --scenario invalid-receipt
 *   pnpm demo:run --scenario trust-tests
 *   pnpm demo:run --all
 */

import { Command } from 'commander';
import { config } from 'dotenv';
import { PermissionRouter } from '@permission-protocol/sdk';
import { printHeader, printSeparator, printSummary } from './output.js';

// Load environment variables
config();

// Validate environment
function validateEnv(): { endpoint: string; apiKey: string; tenantId: string; agentId: string } {
  const endpoint = process.env.PP_ENDPOINT;
  const apiKey = process.env.PP_API_KEY;
  const tenantId = process.env.PP_TENANT_ID;
  const agentId = process.env.PP_AGENT_ID || 'demo-agent';

  if (!endpoint) {
    console.error('Error: PP_ENDPOINT environment variable is required');
    console.error('Set it to your Permission Protocol API endpoint');
    process.exit(1);
  }

  if (!apiKey) {
    console.error('Error: PP_API_KEY environment variable is required');
    console.error('Get an API key from your Permission Protocol instance');
    process.exit(1);
  }

  if (!tenantId) {
    console.error('Error: PP_TENANT_ID environment variable is required');
    console.error('This is your company/tenant ID in Permission Protocol');
    process.exit(1);
  }

  return { endpoint, apiKey, tenantId, agentId };
}

// Import scenarios dynamically to avoid loading before config
async function loadScenarios() {
  return {
    spend: await import('./scenarios/spend.js'),
    prod: await import('./scenarios/prod-write.js'),
    message: await import('./scenarios/message.js'),
    'invalid-receipt': await import('./scenarios/invalid-receipt.js'),
    'trust-tests': await import('./scenarios/trust-tests.js'),
  };
}

type ScenarioName = 'spend' | 'prod' | 'message' | 'invalid-receipt' | 'trust-tests';

const program = new Command();

program
  .name('demo')
  .description('Permission Protocol reference demo - authority boundaries for AI agents')
  .version('1.0.0');

program
  .option('-s, --scenario <name>', 'Run specific scenario (spend, prod, message, invalid-receipt)')
  .option('-a, --all', 'Run all scenarios')
  .action(async (options) => {
    const env = validateEnv();

    // Configure the SDK
    PermissionRouter.configure({
      endpoint: env.endpoint,
      apiKey: env.apiKey,
    });

    printHeader();

    const scenarios = await loadScenarios();
    const results: { scenario: string; status: string; match: boolean }[] = [];

    if (options.all) {
      // Run all scenarios
      const scenarioOrder: ScenarioName[] = ['spend', 'prod', 'message', 'invalid-receipt'];
      
      for (const name of scenarioOrder) {
        const scenario = scenarios[name];
        await scenario.run(env.tenantId, env.agentId);
        
        results.push({
          scenario: scenario.SCENARIO_NAME,
          status: scenario.EXPECTED_STATUS,
          match: true, // We don't track actual match in this version
        });
        
        if (name !== 'invalid-receipt') {
          printSeparator();
        }
      }

      printSummary(results);
    } else if (options.scenario) {
      // Run specific scenario
      const name = options.scenario as ScenarioName;
      const scenario = scenarios[name];
      
      if (!scenario) {
        console.error(`Unknown scenario: ${name}`);
        console.error('Available scenarios: spend, prod, message, invalid-receipt');
        process.exit(1);
      }

      await scenario.run(env.tenantId, env.agentId);
    } else {
      // No scenario specified - show help
      console.log('No scenario specified. Use --scenario or --all');
      console.log();
      console.log('Available scenarios:');
      console.log('  spend           - Spending money (expected: DENIED)');
      console.log('  prod            - Writing to production (expected: REQUIRES_APPROVAL)');
      console.log('  message         - Messaging customers (expected: REQUIRES_APPROVAL)');
      console.log('  invalid-receipt - Fail-closed behavior (expected: ERROR)');
      console.log('  trust-tests     - Manual trust verification tests (3 tests)');
      console.log();
      console.log('Examples:');
      console.log('  pnpm demo:run --scenario spend');
      console.log('  pnpm demo:run --scenario trust-tests');
      console.log('  pnpm demo:run --all');
    }
  });

program.parse();
