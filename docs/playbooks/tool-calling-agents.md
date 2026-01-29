# Playbook A: Tool-Calling Agents

Pattern for OpenAI, Anthropic, and other function-calling LLMs.

## The Pattern

Wrap every tool call in `PermissionRouter.execute()` before execution.

```typescript
import { PermissionRouter } from '@permission-protocol/sdk';

// Configure once at startup
PermissionRouter.configure({
  endpoint: process.env.PP_ENDPOINT,
  apiKey: process.env.PP_API_KEY,
});

// Your tool executor
async function executeTool(
  tenantId: string,
  agentId: string,
  toolCall: { name: string; arguments: unknown }
) {
  // 1. Request authorization
  const result = await PermissionRouter.execute({
    tenantId,
    agentId,
    tool: toolCall.name,
    operation: 'invoke',
    input: toolCall.arguments,
  });

  // 2. Check decision
  if (result.status !== 'APPROVED') {
    return {
      blocked: true,
      reason: result.receipt.reasonCodes,
      receiptId: result.receipt.receiptId,
    };
  }

  // 3. Execute only if approved
  const output = await tools[toolCall.name](toolCall.arguments);
  
  return { blocked: false, output, receiptId: result.receipt.receiptId };
}
```

## Denial Example

Agent tries to charge a customer without authorization:

```typescript
const result = await PermissionRouter.execute({
  tenantId: 'acme',
  agentId: 'billing-agent',
  tool: 'stripe',
  operation: 'charge',
  input: { amount: 500, currency: 'USD', customer: 'cust_123' },
});

// result.status === 'DENIED'
// result.receipt.reasonCodes === ['POLICY_DENIED', 'D_PROHIBITED']
// Tool is NOT executed
```

## Approval Example

Agent requests to publish a blog post and gets approved:

```typescript
const result = await PermissionRouter.execute({
  tenantId: 'acme',
  agentId: 'content-agent',
  tool: 'wordpress',
  operation: 'publish_post',
  input: { title: 'New Feature Announcement', status: 'publish' },
});

// result.status === 'APPROVED'
// result.receipt.approver === 'policy'
// Proceed with tool execution
await wordpress.publishPost(result.receipt.receiptId, input);
```

## Fail-Closed Behavior

If Permission Protocol is unreachable or returns an error, the SDK throws an exception:

```typescript
try {
  const result = await PermissionRouter.execute({ ... });
} catch (error) {
  // PermissionProtocolError: EXECUTION_UNAUTHORIZED
  // Tool is NOT executed
  // This is intentional fail-closed behavior
}
```

No receipt = No execution. This is by design.

## What Breaks If Permission Protocol Is Removed

If Permission Protocol is removed, this workflow must re-implement approval gating, audit trails, and fail-closed enforcement manually.
