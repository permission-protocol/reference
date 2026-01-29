# Permission Protocol Reference Demo

Demonstrates authority boundaries for AI agents using the Permission Protocol SDK.

## What This Demo Shows

| Scenario | Tool | Expected Outcome |
|----------|------|------------------|
| Spending Money | `billing.charge` | **DENIED** - AI cannot spend without authorization |
| Writing to Prod | `db.write` | **REQUIRES_APPROVAL** - Human must approve |
| Messaging Customers | `messaging.send` | **REQUIRES_APPROVAL** (Founder Veto) |
| Fail-Closed | `test.invalid` | **Throws exception** - No receipt = No deploy |

The SDK has exactly 3 status states: `APPROVED`, `REQUIRES_APPROVAL`, `DENIED`. The fail-closed scenario demonstrates what happens when authorization cannot be verified - it throws an exception and blocks execution. This is intentional.

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/permission-protocol/reference-demo.git
cd reference-demo
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your PP credentials

# 3. Run the demo
pnpm demo:all
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PP_ENDPOINT` | Permission Protocol API endpoint |
| `PP_API_KEY` | API key (requires `permission:execute` scope) |
| `PP_TENANT_ID` | Your tenant/company ID |
| `PP_AGENT_ID` | Agent ID (default: `demo-agent`) |

## Running Scenarios

```bash
# Run all scenarios
pnpm demo:all

# Run specific scenario
pnpm demo:run --scenario spend
pnpm demo:run --scenario prod
pnpm demo:run --scenario message
pnpm demo:run --scenario invalid-receipt
```

## Example Output

```
  ╔═══════════════════════════════════════════════════════════╗
  ║       Permission Protocol - Reference Demo                ║
  ║       Authority Boundaries for AI Agents                  ║
  ╚═══════════════════════════════════════════════════════════╝

┌───────────────────────────────────────────────────────────────┐
│ SCENARIO: Spending Money                                      │
├───────────────────────────────────────────────────────────────┤
│ Tool:        billing.charge                                   │
│ Operation:   charge_customer                                  │
│ Decision:    DENIED                                           │
│ Receipt ID:  rec_abc123...                                    │
│ Reason(s):   POLICY_DENIED                                    │
├───────────────────────────────────────────────────────────────┤
│ ✗ Action blocked by Permission Protocol                       │
└───────────────────────────────────────────────────────────────┘
```

## Key Concepts

### The SDK Does NOT Execute Tools

The Permission Protocol SDK only:
- Requests authorization from hosted Permission Protocol
- Returns decisions and receipts
- Fails closed on errors

The SDK does NOT:
- Make policy decisions
- Execute tools
- Store receipts
- Implement policy logic

### Fail-Closed Behavior

When the Permission Protocol is unreachable or returns an error, the SDK throws an exception. **No receipt = No execution.** This is intentional.

### Three-State Decisions

The SDK maps all responses to three states:

| SDK Status | Meaning |
|------------|---------|
| `APPROVED` | Action authorized, proceed |
| `REQUIRES_APPROVAL` | Human approval needed |
| `DENIED` | Action blocked |

### Receipts Are Immutable

Every decision produces a `PermissionReceipt` - an immutable artifact that can be:
- Verified in CI pipelines
- Exported for audit
- Used as proof of authorization

## CI Integration

See `.github/workflows/demo-receipt-gate.yml` for an example of blocking deploys without valid receipts.

## Learn More

- [Permission Protocol Documentation](https://github.com/permission-protocol/docs)
- [SDK Reference](https://github.com/permission-protocol/sdk)
