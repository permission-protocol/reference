# Playbook B: LangGraph / Planner-Executor Loops

Pattern for planner-executor architectures where Permission Protocol sits between plan and execution.

## The Pattern

PP gates the edge between planner and executor. Receipts control which plan steps can execute.

```typescript
import { PermissionRouter } from '@permission-protocol/sdk';

// Configure once
PermissionRouter.configure({
  endpoint: process.env.PP_ENDPOINT,
  apiKey: process.env.PP_API_KEY,
});

// Executor node that gates on receipts
async function executeStep(
  tenantId: string,
  agentId: string,
  step: { tool: string; operation: string; params: unknown }
) {
  // Gate execution on PP authorization
  const result = await PermissionRouter.execute({
    tenantId,
    agentId,
    tool: step.tool,
    operation: step.operation,
    input: step.params,
    reversibility: 'IRREVERSIBLE',
  });

  switch (result.status) {
    case 'APPROVED':
      return { execute: true, receipt: result.receipt };
    
    case 'REQUIRES_APPROVAL':
      // Founder veto or human approval needed
      return { 
        execute: false, 
        waiting: true,
        receipt: result.receipt,
        reason: result.receipt.reasonCodes,
      };
    
    case 'DENIED':
      return { 
        execute: false, 
        blocked: true,
        receipt: result.receipt,
        reason: result.receipt.reasonCodes,
      };
  }
}
```

## Blocked Plan Example

Planner creates a step to message all customers. Founder veto blocks it:

```typescript
const plan = [
  { tool: 'db', operation: 'read', params: { table: 'users' } },
  { tool: 'email', operation: 'send_campaign', params: { audience: 'all' } },
];

// Step 1: Read users - APPROVED (read-only)
// Step 2: Send campaign - REQUIRES_APPROVAL (founder veto)

const step2Result = await executeStep(tenantId, agentId, plan[1]);
// step2Result.waiting === true
// step2Result.receipt.reasonCodes === ['REQUIRES_FOUNDER_VETO']
// Plan execution pauses until founder approves
```

## Approved Flow Example

Planner creates a low-risk workflow that executes fully:

```typescript
const plan = [
  { tool: 'github', operation: 'create_branch', params: { name: 'feature-x' } },
  { tool: 'github', operation: 'create_pr', params: { title: 'Add feature X' } },
];

// Step 1: Create branch - APPROVED
// Step 2: Create PR - APPROVED

for (const step of plan) {
  const result = await executeStep(tenantId, agentId, step);
  if (!result.execute) {
    console.log(`Blocked at ${step.tool}:${step.operation}`);
    break;
  }
  await tools[step.tool][step.operation](step.params);
}
```

## Modeling Founder Veto

For high-stakes actions, PP returns `REQUIRES_APPROVAL` with `REQUIRES_FOUNDER_VETO` reason code:

```typescript
const result = await PermissionRouter.execute({
  tenantId: 'acme',
  agentId: 'growth-agent',
  tool: 'email',
  operation: 'send_campaign',
  input: { audience: 'all_customers', subject: 'Big Announcement' },
});

if (result.receipt.reasonCodes.includes('REQUIRES_FOUNDER_VETO')) {
  // Escalate to founder approval flow
  await notifyFounder(result.receipt);
}
```

## What Breaks If Permission Protocol Is Removed

If Permission Protocol is removed, this workflow must re-implement approval gating, audit trails, and founder veto enforcement manually.
