# Playbook C: CI / Automation Jobs

Pattern for cron agents, GitHub Actions, and deploy pipelines.

## The Pattern

Gate deployments and automated jobs on Permission Protocol receipts. No receipt = no deploy.

## GitHub Actions Receipt Gate

Use the receipt-gate action to verify authorization before deployment:

```yaml
name: Deploy with Receipt Gate
on:
  workflow_dispatch:
    inputs:
      receipt_id:
        description: 'Permission Receipt ID'
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Verify Receipt
        run: |
          RESPONSE=$(curl -sf \
            -H "Authorization: Bearer ${{ secrets.PP_API_KEY }}" \
            -H "X-PP-Tenant-Id: ${{ secrets.PP_TENANT_ID }}" \
            "${{ secrets.PP_ENDPOINT }}/api/v1/receipts/${{ inputs.receipt_id }}")
          
          DECISION=$(echo "$RESPONSE" | jq -r '.receipt.status')
          
          if [ "$DECISION" != "APPROVED" ]; then
            echo "::error::Receipt not approved: $DECISION"
            exit 1
          fi
          
          echo "Receipt verified: ${{ inputs.receipt_id }}"
      
      - name: Deploy
        if: success()
        run: ./deploy.sh
```

## Missing Receipt Failure

When no receipt is provided or receipt doesn't exist:

```yaml
# Workflow triggered without receipt_id
- name: Verify Receipt
  run: |
    curl -sf "$PP_ENDPOINT/api/v1/receipts/$RECEIPT_ID" || {
      echo "::error::Receipt not found"
      echo "::error::No receipt = No deploy"
      exit 1
    }

# Output:
# Error: Receipt not found
# Error: No receipt = No deploy
# Job failed
```

## Gated Deploy Success

When receipt exists and is approved:

```yaml
# Workflow triggered with valid receipt_id
- name: Verify Receipt
  run: |
    RESPONSE=$(curl -sf ...)
    DECISION=$(echo "$RESPONSE" | jq -r '.receipt.status')
    # DECISION === "APPROVED"
    echo "Receipt verified, proceeding with deploy"

- name: Deploy
  run: ./deploy.sh
  # Deployment proceeds
```

## Cron Agent Pattern

For scheduled automation that needs authorization:

```typescript
// cron-job.ts
import { PermissionRouter } from '@permission-protocol/sdk';

async function dailyReport() {
  // Request authorization for the scheduled action
  const result = await PermissionRouter.execute({
    tenantId: process.env.TENANT_ID,
    agentId: 'cron-reporter',
    tool: 'reporting',
    operation: 'generate_daily_summary',
    input: { date: new Date().toISOString().split('T')[0] },
  });

  if (result.status !== 'APPROVED') {
    console.log(`Report blocked: ${result.receipt.reasonCodes}`);
    process.exit(1);
  }

  // Execute only if approved
  await generateReport(result.receipt.receiptId);
}
```

## Receipts in CI Artifacts

Store receipt IDs with deployments for audit:

```yaml
- name: Record Deployment
  run: |
    echo "receipt_id=${{ inputs.receipt_id }}" >> deployment-record.txt
    echo "commit=${{ github.sha }}" >> deployment-record.txt
    echo "timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> deployment-record.txt

- uses: actions/upload-artifact@v4
  with:
    name: deployment-audit
    path: deployment-record.txt
```

## What Breaks If Permission Protocol Is Removed

If Permission Protocol is removed, this workflow must re-implement receipt verification, audit logging, and deploy gates manually.
