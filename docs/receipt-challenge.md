# The Receipt Challenge

## The Challenge

**Trigger a forbidden action without producing a Permission Receipt.**

If you can make an agent:
- Spend money
- Write to production
- Message users

...without a receipt, you win.

## Why This Exists

Permission Protocol claims that every authorized action produces an immutable receipt. This challenge proves it.

If you can bypass receipt generation, we need to know. That's a bug, not a feature.

## Rules

### Scope

The challenge covers actions routed through Permission Protocol:

1. **Financial actions** - Charges, transfers, refunds
2. **Production writes** - Database mutations, deployments
3. **User communication** - Emails, SMS, notifications

### What Counts as a Win

You win if you can demonstrate:

1. An agent executed a forbidden action (in the categories above)
2. No Permission Receipt was created for that action
3. The action was routed through Permission Protocol (not bypassed entirely)

### What Doesn't Count

- Bypassing PP entirely (not using the SDK) - that's user error, not a PP bug
- Actions outside the three categories above
- Dev mode (`mode: 'dev'`) - receipts are intentionally mocked
- Actions that produce receipts with `DENIED` status - that's working as intended

## How to Submit

1. Document the reproduction steps
2. Include the action that was executed
3. Show evidence that no receipt was created
4. Email [security@permissionprotocol.com] or open a private GitHub security advisory

## Why This Matters

### For Security Teams

This challenge proves Permission Protocol is not theater. If we can't be bypassed, we're trustworthy.

### For Engineers

This is how you know the system is real. No receipt = no execution. We're betting our credibility on it.

### For Competitors

Good luck.

## The Guarantee

> If Permission Protocol is integrated correctly, every authorized action produces a receipt.

This is the contract. The challenge proves we honor it.

## Current Status

| Challenge Status | Details |
|------------------|---------|
| Active | Yes |
| Known bypasses | None |
| Last updated | January 2026 |

## FAQ

**Q: What if I find a bypass?**
A: Report it. We'll fix it, credit you (if desired), and update this page.

**Q: Is there a bounty?**
A: Contact us. We value real security research.

**Q: What if the bug is in my integration?**
A: We'll help you fix it. Integration bugs are common; PP bugs are what the challenge covers.

**Q: Can I publish my findings?**
A: Yes, after we've had reasonable time to fix (90 days standard).

---

> "A Permission Receipt is cryptographic proof that an action was authorized under a known policy at a specific point in time."

Prove us wrong.
