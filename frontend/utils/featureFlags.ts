// Simple feature flag utility.
// Usage: if (isClaudeSonnet4Enabled()) { ... }

/// <reference types="node" />
export function isClaudeSonnet4Enabled(): boolean {
  const val = (typeof process !== 'undefined' && process.env && process.env.CLAUDE_SONNET4) || '';
  return val === '1' || val.toLowerCase() === 'true';
}

export function requireClaudeSonnet4<T>(val: T): T | undefined {
  return isClaudeSonnet4Enabled() ? val : undefined;
}
