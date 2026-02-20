import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCurrencyFull, formatPercent, formatNumber } from '../utils';

describe('formatCurrency', () => {
  it('formats millions', () => {
    expect(formatCurrency(1_500_000)).toBe('$1.5M');
  });

  it('formats thousands', () => {
    expect(formatCurrency(102_600)).toBe('$103K');
  });

  it('formats small amounts', () => {
    expect(formatCurrency(500)).toBe('$500');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });
});

describe('formatCurrencyFull', () => {
  it('formats with commas and no cents', () => {
    const result = formatCurrencyFull(102600);
    expect(result).toContain('102,600');
    expect(result).toContain('$');
  });
});

describe('formatPercent', () => {
  it('formats with default 1 decimal', () => {
    expect(formatPercent(12.345)).toBe('12.3%');
  });

  it('formats with custom decimals', () => {
    expect(formatPercent(12.345, 2)).toBe('12.35%');
  });

  it('formats zero', () => {
    expect(formatPercent(0)).toBe('0.0%');
  });
});

describe('formatNumber', () => {
  it('formats millions', () => {
    expect(formatNumber(2_500_000)).toBe('2.5M');
  });

  it('formats thousands', () => {
    expect(formatNumber(5_200)).toBe('5.2K');
  });

  it('formats small numbers', () => {
    expect(formatNumber(42)).toBe('42');
  });
});
