/**
 * Output Formatting
 * 
 * Beautiful CLI output with boxed results.
 */

import type { ExecuteResult, PermissionReceipt } from '@permission-protocol/sdk';

const BOX_WIDTH = 65;
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

function colorize(text: string, color: keyof typeof COLORS): string {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function padRight(text: string, width: number): string {
  const visibleLength = text.replace(/\x1b\[[0-9;]*m/g, '').length;
  const padding = Math.max(0, width - visibleLength);
  return text + ' '.repeat(padding);
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function statusColor(status: string): string {
  switch (status) {
    case 'APPROVED':
      return colorize(status, 'green');
    case 'DENIED':
      return colorize(status, 'red');
    case 'REQUIRES_APPROVAL':
      return colorize(status, 'yellow');
    case 'ERROR':
      return colorize(status, 'red');
    default:
      return colorize(status, 'white');
  }
}

interface FormatOptions {
  scenarioName: string;
  tool: string;
  operation: string;
  phase: 'REQUESTING' | 'RESULT' | 'ERROR' | 'UNEXPECTED';
  input?: unknown;
  result?: ExecuteResult<unknown>;
  expectedStatus?: string;
  statusMatch?: boolean;
  errorCode?: string;
  errorMessage?: string;
  message?: string;
}

export function formatResult(opts: FormatOptions): string {
  const lines: string[] = [];
  const innerWidth = BOX_WIDTH - 4; // Account for borders

  // Top border
  lines.push(`┌${'─'.repeat(BOX_WIDTH - 2)}┐`);

  // Scenario header
  const header = ` SCENARIO: ${opts.scenarioName}`;
  lines.push(`│${padRight(header, BOX_WIDTH - 2)}│`);
  lines.push(`├${'─'.repeat(BOX_WIDTH - 2)}┤`);

  // Tool and operation
  lines.push(`│${padRight(` Tool:        ${opts.tool}`, BOX_WIDTH - 2)}│`);
  lines.push(`│${padRight(` Operation:   ${opts.operation}`, BOX_WIDTH - 2)}│`);

  if (opts.phase === 'REQUESTING') {
    // Show input summary
    lines.push(`├${'─'.repeat(BOX_WIDTH - 2)}┤`);
    lines.push(`│${padRight(` ${colorize('Requesting authorization...', 'cyan')}`, BOX_WIDTH - 2)}│`);
  } else if (opts.phase === 'RESULT' && opts.result) {
    const receipt = opts.result.receipt;
    
    // Decision
    lines.push(`│${padRight(` Decision:    ${statusColor(opts.result.status)}`, BOX_WIDTH - 2)}│`);
    lines.push(`│${padRight(` Receipt ID:  ${truncate(receipt.receiptId, 40)}`, BOX_WIDTH - 2)}│`);
    
    // Reason codes (printed but not asserted)
    if (receipt.reasonCodes && receipt.reasonCodes.length > 0) {
      lines.push(`│${padRight(` Reason(s):   ${receipt.reasonCodes.join(', ')}`, BOX_WIDTH - 2)}│`);
    }

    // Divider
    lines.push(`├${'─'.repeat(BOX_WIDTH - 2)}┤`);

    // Status indicator
    if (opts.statusMatch !== undefined) {
      const icon = opts.statusMatch ? colorize('✓', 'green') : colorize('✗', 'red');
      const action = opts.result.status === 'APPROVED' 
        ? 'Action authorized by Permission Protocol'
        : opts.result.status === 'DENIED'
        ? 'Action blocked by Permission Protocol'
        : 'Action requires human approval';
      lines.push(`│${padRight(` ${icon} ${action}`, BOX_WIDTH - 2)}│`);
    }
  } else if (opts.phase === 'ERROR') {
    lines.push(`│${padRight(` ${colorize('ERROR', 'red')}: ${opts.errorCode || 'UNKNOWN'}`, BOX_WIDTH - 2)}│`);
    if (opts.errorMessage) {
      const truncatedMsg = truncate(opts.errorMessage, innerWidth - 4);
      lines.push(`│${padRight(`   ${truncatedMsg}`, BOX_WIDTH - 2)}│`);
    }
    lines.push(`├${'─'.repeat(BOX_WIDTH - 2)}┤`);
    lines.push(`│${padRight(` ${colorize('✗', 'red')} ${opts.message || 'Operation failed'}`, BOX_WIDTH - 2)}│`);
  } else if (opts.phase === 'UNEXPECTED') {
    lines.push(`│${padRight(` ${colorize('⚠', 'yellow')} ${opts.message || 'Unexpected result'}`, BOX_WIDTH - 2)}│`);
  }

  // Bottom border
  lines.push(`└${'─'.repeat(BOX_WIDTH - 2)}┘`);

  return lines.join('\n');
}

export function printHeader(): void {
  console.log();
  console.log(colorize('  ╔═══════════════════════════════════════════════════════════╗', 'cyan'));
  console.log(colorize('  ║       Permission Protocol - Reference Demo                ║', 'cyan'));
  console.log(colorize('  ║       Authority Boundaries for AI Agents                  ║', 'cyan'));
  console.log(colorize('  ╚═══════════════════════════════════════════════════════════╝', 'cyan'));
  console.log();
}

export function printSeparator(): void {
  console.log();
  console.log(colorize('  ─────────────────────────────────────────────────────────────', 'dim'));
  console.log();
}

export function printSummary(results: { scenario: string; status: string; match: boolean }[]): void {
  console.log();
  console.log(colorize('  Summary', 'bold'));
  console.log(colorize('  ───────', 'dim'));
  
  for (const r of results) {
    const icon = r.match ? colorize('✓', 'green') : colorize('✗', 'red');
    console.log(`  ${icon} ${r.scenario}: ${statusColor(r.status)}`);
  }
  
  const allPassed = results.every(r => r.match);
  console.log();
  if (allPassed) {
    console.log(colorize('  All scenarios completed as expected.', 'green'));
  } else {
    console.log(colorize('  Some scenarios did not match expected status.', 'yellow'));
  }
  console.log();
}

/**
 * Format output for fail-closed scenarios.
 * This is NOT a 4th status - it's an exception path.
 */
interface FailClosedOptions {
  scenarioName: string;
  tool: string;
  operation: string;
  phase: 'REQUESTING' | 'FAIL_CLOSED' | 'UNEXPECTED';
  errorCode?: string;
  errorMessage?: string;
  message?: string;
}

export function formatFailClosed(opts: FailClosedOptions): string {
  const lines: string[] = [];

  // Top border
  lines.push(`┌${'─'.repeat(BOX_WIDTH - 2)}┐`);

  // Scenario header
  const header = ` SCENARIO: ${opts.scenarioName}`;
  lines.push(`│${padRight(header, BOX_WIDTH - 2)}│`);
  lines.push(`├${'─'.repeat(BOX_WIDTH - 2)}┤`);

  // Tool and operation
  lines.push(`│${padRight(` Tool:        ${opts.tool}`, BOX_WIDTH - 2)}│`);
  lines.push(`│${padRight(` Operation:   ${opts.operation}`, BOX_WIDTH - 2)}│`);

  if (opts.phase === 'REQUESTING') {
    lines.push(`├${'─'.repeat(BOX_WIDTH - 2)}┤`);
    lines.push(`│${padRight(` ${colorize('Requesting authorization...', 'cyan')}`, BOX_WIDTH - 2)}│`);
  } else if (opts.phase === 'FAIL_CLOSED') {
    lines.push(`├${'─'.repeat(BOX_WIDTH - 2)}┤`);
    lines.push(`│${padRight(` ${colorize('FAIL-CLOSED', 'red')}: Could not verify receipt`, BOX_WIDTH - 2)}│`);
    if (opts.errorCode) {
      lines.push(`│${padRight(` Error Code:  ${opts.errorCode}`, BOX_WIDTH - 2)}│`);
    }
    if (opts.errorMessage) {
      const truncatedMsg = truncate(opts.errorMessage, BOX_WIDTH - 18);
      lines.push(`│${padRight(` Message:     ${truncatedMsg}`, BOX_WIDTH - 2)}│`);
    }
    lines.push(`├${'─'.repeat(BOX_WIDTH - 2)}┤`);
    lines.push(`│${padRight(` ${colorize('✗', 'red')} No receipt = No deploy. Execution blocked.`, BOX_WIDTH - 2)}│`);
    lines.push(`│${padRight(`   ${colorize('This is intentional fail-closed behavior.', 'dim')}`, BOX_WIDTH - 2)}│`);
  } else if (opts.phase === 'UNEXPECTED') {
    lines.push(`├${'─'.repeat(BOX_WIDTH - 2)}┤`);
    lines.push(`│${padRight(` ${colorize('⚠ UNEXPECTED', 'yellow')}: ${opts.message || 'Bug detected'}`, BOX_WIDTH - 2)}│`);
  }

  // Bottom border
  lines.push(`└${'─'.repeat(BOX_WIDTH - 2)}┘`);

  return lines.join('\n');
}
