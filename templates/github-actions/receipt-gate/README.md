# Permission Protocol Receipt Gate Action

Verify a Permission Protocol receipt before deployment. **No receipt = No deploy.**

## Usage

```yaml
- uses: permission-protocol/receipt-gate@v1
  with:
    receipt_id: ${{ env.PP_RECEIPT_ID }}
    pp_endpoint: ${{ secrets.PP_ENDPOINT }}
    pp_api_key: ${{ secrets.PP_API_KEY }}
    pp_tenant_id: ${{ secrets.PP_TENANT_ID }}
    expected_decision: APPROVED
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `receipt_id` | Yes | - | The receipt ID to verify |
| `pp_endpoint` | Yes | - | Permission Protocol API endpoint |
| `pp_api_key` | Yes | - | API key (Bearer token) |
| `pp_tenant_id` | Yes | - | Tenant/company ID |
| `expected_decision` | No | `APPROVED` | Expected decision |
| `expected_tool` | No | - | Expected tool name |
| `expected_operation` | No | - | Expected operation |
| `fail_on_mismatch` | No | `true` | Fail if checks don't match |

## Outputs

| Output | Description |
|--------|-------------|
| `receipt_id` | The verified receipt ID |
| `decision` | The decision from the receipt |
| `tool` | The tool from the receipt |
| `operation` | The operation from the receipt |
| `valid` | Whether all checks passed |

## Example: Block Deploy Without Approval

```yaml
name: Deploy with Receipt Gate
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Verify Receipt
        uses: permission-protocol/receipt-gate@v1
        with:
          receipt_id: ${{ github.event.inputs.receipt_id }}
          pp_endpoint: ${{ secrets.PP_ENDPOINT }}
          pp_api_key: ${{ secrets.PP_API_KEY }}
          pp_tenant_id: ${{ secrets.PP_TENANT_ID }}
          expected_decision: APPROVED
          expected_tool: deploy
          expected_operation: production
      
      - name: Deploy
        run: |
          echo "Deploying with verified receipt..."
          # Your deploy commands here
```

## Design Principles

### Comparisons Done Locally

The action fetches the receipt from the hosted API, then performs all comparisons locally. This keeps the hosted API thin and prevents it from becoming a mini policy engine.

### Bearer Token Auth

Uses `Authorization: Bearer <api_key>` with `X-PP-Tenant-Id` header, consistent with the SDK's auth model.

### Human-Readable Errors

When verification fails, the action outputs clear diffs showing expected vs actual values.

## Removing This Action

Removing the receipt gate requires modifying your CI pipeline. This is intentional - it makes Permission Protocol "sticky" and ensures authority boundaries are maintained.
