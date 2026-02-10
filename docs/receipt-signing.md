# Receipt Signing & Verification

> This document explains how Permission Protocol enforces signed, single-use permission receipts in CI/CD.
>
> If you haven't seen the demo yet: https://permissionprotocol.com

Cryptographic verification of permission decisions for CI/CD and external systems.

## Overview

Permission Protocol receipts can be cryptographically signed using Ed25519 signatures. This enables:

- **External Verification**: CI/CD pipelines can verify permission decisions without trusting the network
- **One-Time Redemption**: Receipts can only be used once (atomic redemption)
- **Audit Trail**: Cryptographic proof that a specific permission was granted

## Quick Start

### 1. Verify a Receipt (GitHub Actions)

```yaml
- name: Verify Permission Receipt
  uses: ./.github/actions/verify
  with:
    receipt_id: ${{ env.PP_RECEIPT_ID }}
    scope: "github:merge"
    scope_ref: "refs/pull/${{ github.event.pull_request.number }}/merge"
    scope_sha: ${{ github.event.pull_request.merge_commit_sha }}
    fail_on_missing: "true"
  env:
    PP_BASE_URL: ${{ secrets.PP_BASE_URL }}
    PP_API_KEY: ${{ secrets.PP_API_KEY }}
```

### 2. Get Current Public Key

```bash
curl https://your-pp-instance.com/api/v1/keys/current
```

Response:
```json
{
  "keyId": "prod-key-2026-01",
  "algorithm": "ed25519",
  "publicKey": "base64-encoded-public-key",
  "status": "active",
  "createdAt": "2026-01-15T00:00:00.000Z"
}
```

### 3. Verify Receipt Programmatically

```bash
curl -X POST https://your-pp-instance.com/api/v1/receipts/verify \
  -H "Content-Type: application/json" \
  -d '{
    "receiptId": "receipt-uuid",
    "scope": "github:merge",
    "scopeRef": "refs/pull/16/merge",
    "scopeSha": "abc123def456..."
  }'
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PP_SIGNING_MODE` | Yes | `required` (prod), `optional` (dev), `disabled` |
| `PP_SIGNING_KEY_ID` | When required | Key identifier (e.g., `prod-key-2026-01`) |
| `PP_SIGNING_PRIVATE_KEY` | When required | Base64-encoded Ed25519 private key |
| `PP_RECEIPT_EXPIRATION_MS` | No | Receipt TTL (default: 3600000 = 1 hour) |

### Signing Modes

- **`required`** (production): Unsigned ALLOW receipts fail at write time
- **`optional`** (development): Signs if key available, passes unsigned if not
- **`disabled`**: No signing, verification endpoints return errors

## API Reference

### GET /api/v1/keys/current

Returns the active signing key for the environment.

**Response:**
```json
{
  "keyId": "string",
  "algorithm": "ed25519",
  "publicKey": "base64-string",
  "status": "active",
  "createdAt": "ISO-8601"
}
```

### GET /api/v1/keys/:keyId

Returns a specific key by ID (for key rotation scenarios).

**Response:** Same as above, status may be `active`, `rotated`, or `revoked`.

### POST /api/v1/receipts/verify

Verifies a receipt signature and optionally redeems it (one-time use).

**Request:**
```json
{
  "receiptId": "uuid",
  "scope": "github:merge",
  "scopeRef": "refs/pull/16/merge",
  "scopeSha": "commit-sha",
  "redeem": true
}
```

**Success Response:**
```json
{
  "valid": true,
  "receipt": {
    "id": "uuid",
    "decision": "ALLOW",
    "scope": "github:merge",
    "scopeRef": "refs/pull/16/merge",
    "scopeSha": "commit-sha",
    "issuedAt": "ISO-8601",
    "expiresAt": "ISO-8601",
    "redeemedAt": "ISO-8601"
  }
}
```

**Error Codes:**

| Code | Description |
|------|-------------|
| `PP_NO_RECEIPT` | Receipt ID not found |
| `PP_EXPIRED` | Receipt has expired |
| `PP_REDEEMED` | Receipt already used |
| `PP_SCOPE_MISMATCH` | Scope/ref/sha doesn't match |
| `PP_UNSIGNED_RECEIPT` | Receipt lacks required signature |
| `PP_INVALID_SIGNATURE` | Signature verification failed |

## Signature Format

Receipts are signed using Ed25519 over a JCS-canonicalized JSON payload:

```json
{
  "decision": "ALLOW",
  "expiresAt": "2026-02-10T21:00:00.000Z",
  "issuedAt": "2026-02-10T20:00:00.000Z",
  "receiptId": "uuid",
  "scope": "github:merge",
  "scopeRef": "refs/pull/16/merge",
  "scopeSha": "abc123..."
}
```

The payload is:
1. Canonicalized with sorted keys (JCS)
2. SHA-256 hashed
3. Signed with Ed25519

## Key Rotation

Keys have three statuses:

- **`active`**: Current signing key
- **`rotated`**: Old key, still verifies but not used for new signatures
- **`revoked`**: Verification fails immediately

To rotate keys:

1. Create new key with `active` status
2. Update `PP_SIGNING_KEY_ID` to new key
3. Old key automatically becomes `rotated`
4. After grace period, mark old key `revoked`

## Branch Protection Integration

For GitHub merge gates:

1. Enable branch protection on `main`
2. Require the "Verify Permission Receipt" status check
3. Set `fail_on_missing: true` in the action
4. PRs cannot merge without a valid, unredeemed receipt

### Creating Receipts for Merges

Receipts must be created with:
- `scope`: `github:merge`
- `scopeRef`: `refs/pull/{number}/merge`
- `scopeSha`: The merge commit SHA (not the branch HEAD)

## Security Considerations

1. **Private keys**: Never commit. Use secrets management.
2. **Key mismatch**: Server crashes on startup if configured key doesn't match DB.
3. **Rate limiting**: Verify endpoint is rate-limited (100/min/IP).
4. **Fail closed**: Missing signatures on ALLOW receipts are fatal in `required` mode.

## Troubleshooting

### "PP_UNSIGNED_RECEIPT" in CI

- Check `PP_SIGNING_MODE` is `required` on server
- Verify receipt was created after signing was enabled
- Check key is `active` (not `revoked`)

### "PP_SCOPE_MISMATCH" in CI

- Ensure `scopeSha` is the **merge commit SHA**, not branch HEAD
- Use `refs/pull/{N}/merge` format for `scopeRef`
- Check scope matches exactly (case-sensitive)

### Key startup crash

Server logs: "Key mismatch: configured key ... not found or not active"

- Verify `PP_SIGNING_KEY_ID` matches an active key in DB
- Run migrations if deploying to new environment
