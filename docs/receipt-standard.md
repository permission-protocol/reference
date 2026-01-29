# The Permission Receipt Standard

> A Permission Receipt is cryptographic proof that an action was authorized under a known policy at a specific point in time.

## What This Document Defines

This is the normative specification for Permission Receipts. It defines:

1. What a Permission Receipt is
2. Required fields
3. Spec versioning guarantees
4. What receipts prove (and what they don't)

## What a Permission Receipt Is

A Permission Receipt is an **immutable artifact** that proves:

- **Who** requested authorization (agent)
- **What** action was requested (tool + operation)
- **When** the decision was made (timestamp)
- **What** the decision was (approved, denied, requires approval)
- **Why** the decision was made (reason codes)
- **Under what policy** (policy version)

Receipts are created by the Permission Protocol when an agent requests authorization for an action. They cannot be modified after creation.

## What a Permission Receipt Is NOT

- **Not a log.** Receipts are discrete artifacts, not append-only streams.
- **Not proof the action was "correct."** A receipt proves authorization, not correctness.
- **Not a guarantee the action succeeded.** Authorization and execution are separate.
- **Not a policy description.** Receipts reference policies; they don't contain them.
- **Not a replay mechanism.** You cannot "replay" a receipt to re-execute an action.

These boundaries are intentional. Receipts are narrow and defensible by design.

## Required Fields

Every Permission Receipt MUST contain:

| Field | Type | Description |
|-------|------|-------------|
| `receiptId` | string | Unique identifier for this receipt |
| `tenantId` | string | Tenant/organization that owns this receipt |
| `agentId` | string | Agent that requested authorization |
| `tool` | string | Tool being invoked (e.g., `wordpress`, `github`) |
| `operation` | string | Operation on the tool (e.g., `publish_post`, `create_pr`) |
| `inputHash` | string | SHA-256 hash of canonical input (`sha256:<hex>`) |
| `decision` | enum | `APPROVED`, `DENIED`, or `REQUIRES_APPROVAL` |
| `reasonCodes` | string[] | Codes explaining the decision |
| `approver` | enum | `policy`, `human`, `founder`, or `dev_mock` |
| `createdAt` | string | ISO 8601 timestamp |

## Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `policyVersion` | string | Version of the policy that made the decision |
| `receiptSig` | string | Cryptographic signature (future) |
| `sigAlg` | enum | Signature algorithm: `ed25519` or `hmac-sha256` (future) |

## Spec Versioning

Permission Protocol uses explicit versioning for all specifications:

| Spec | Current Version | Description |
|------|-----------------|-------------|
| Protocol | `1` | Overall API contract version |
| Hashable Payload | `pp.hashable_payload.v1` | Canonical input hashing |
| Status Mapping | `pp.status_mapping.v1` | Hosted-to-SDK status mapping |

### Versioning Guarantees

1. **No silent changes.** Behavior changes require a new spec version.
2. **Old versions remain valid.** `pp.hashable_payload.v1` will always behave the same.
3. **Receipts reference their spec versions.** You can always verify which spec was used.

## What Receipts Prove

Given a Permission Receipt, you can verify:

1. **Authorization occurred.** The action was submitted to Permission Protocol.
2. **The decision is recorded.** Approved, denied, or requires approval.
3. **The input is known.** The `inputHash` can be verified against actual input.
4. **The timestamp is fixed.** The decision was made at a specific point in time.
5. **The policy version is recorded.** You know which policy version was applied.

## What Receipts Do NOT Prove

1. **Execution success.** A receipt does not mean the action completed.
2. **Correctness.** A receipt does not mean the action was the right thing to do.
3. **Current validity.** A receipt from yesterday doesn't authorize action today.
4. **Policy content.** A receipt references a policy version, not the policy itself.

## The Three Decisions

The SDK exposes exactly three decision states:

| Decision | Meaning | Agent Action |
|----------|---------|--------------|
| `APPROVED` | Action authorized | Proceed with execution |
| `REQUIRES_APPROVAL` | Human approval needed | Wait or escalate |
| `DENIED` | Action blocked | Do not execute |

There is no fourth state. Errors throw exceptions and block execution (fail-closed).

## Input Hash Verification

The `inputHash` field enables verification that the authorized action matches what was executed:

```
inputHash = sha256:<hex>
```

To verify:
1. Reconstruct the `HashablePayloadV1` from the action
2. Canonicalize using `pp.hashable_payload.v1` spec
3. Compute SHA-256 hash
4. Compare to `inputHash` in receipt

If they match, the receipt covers exactly that input.

## Usage

### Requesting Authorization

```typescript
import { PermissionRouter } from '@permission-protocol/sdk';

const result = await PermissionRouter.execute({
  tenantId: 'acme',
  agentId: 'billing-agent',
  tool: 'stripe',
  operation: 'charge',
  input: { amount: 100, currency: 'USD' },
});

// result.receipt contains the Permission Receipt
console.log(result.receipt.receiptId);
```

### Verifying a Receipt in CI

```bash
# Fetch receipt
curl -H "Authorization: Bearer $API_KEY" \
  "$PP_ENDPOINT/api/v1/receipts/$RECEIPT_ID"

# Verify decision is APPROVED before deploying
```

## Related Specifications

- [Hashable Payload v1](https://github.com/permission-protocol/sdk/blob/main/spec/hashable-payload-v1.md) - Canonical input format
- [Status Mapping v1](https://github.com/permission-protocol/sdk/blob/main/spec/status-mapping-v1.md) - Decision mapping rules
- [Golden Vectors](https://github.com/permission-protocol/sdk/blob/main/spec/golden-vectors.json) - Test vectors for verification
