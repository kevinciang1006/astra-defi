import {
  formatUsd,
  formatNumber,
  formatPercent,
  formatAddress,
  getChangeColor,
  formatTokenBalance,
} from '../format';

describe('formatUsd', () => {
  it('formats positive numbers as currency', () => {
    expect(formatUsd(1234.56)).toBe('$1,234.56');
    expect(formatUsd(0)).toBe('$0.00');
    expect(formatUsd(999.99)).toBe('$999.99');
  });

  it('formats negative numbers as currency', () => {
    expect(formatUsd(-1234.56)).toBe('-$1,234.56');
  });

  it('formats large numbers with compact notation', () => {
    expect(formatUsd(1500000, { compact: true })).toBe('$1.50M');
    expect(formatUsd(1000, { compact: true })).toBe('$1.00K');
  });

  it('formats numbers under 1000 normally even with compact option', () => {
    expect(formatUsd(500, { compact: true })).toBe('$500.00');
  });
});

describe('formatNumber', () => {
  it('formats large numbers with commas and 2 decimals', () => {
    expect(formatNumber(1234567.89)).toBe('1,234,567.89');
  });

  it('formats numbers >= 1 with up to 4 decimals', () => {
    expect(formatNumber(1.23456789)).toBe('1.2346');
    expect(formatNumber(10.5)).toBe('10.5');
  });

  it('formats small numbers with more precision', () => {
    expect(formatNumber(0.12345)).toBe('0.1235');
    expect(formatNumber(0.5)).toBe('0.5');
  });

  it('uses exponential notation for very small numbers', () => {
    expect(formatNumber(0.00001)).toBe('1.00e-5');
    expect(formatNumber(0.000099)).toBe('9.90e-5');
  });
});

describe('formatPercent', () => {
  it('formats positive percentages with + sign', () => {
    expect(formatPercent(5.25)).toBe('+5.25%');
    expect(formatPercent(0.01)).toBe('+0.01%');
  });

  it('formats negative percentages', () => {
    expect(formatPercent(-3.5)).toBe('-3.50%');
  });

  it('formats zero', () => {
    expect(formatPercent(0)).toBe('+0.00%');
  });

  it('returns -- for null values', () => {
    expect(formatPercent(null)).toBe('--');
  });
});

describe('formatAddress', () => {
  it('truncates long addresses', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    expect(formatAddress(address)).toBe('0x1234...5678');
    expect(formatAddress(address, 6)).toBe('0x123456...345678');
  });

  it('returns short addresses unchanged', () => {
    const shortAddress = '0x1234';
    expect(formatAddress(shortAddress)).toBe('0x1234');
  });
});

describe('getChangeColor', () => {
  it('returns green for positive changes', () => {
    expect(getChangeColor(5.5)).toBe('text-green-500');
    expect(getChangeColor(0.01)).toBe('text-green-500');
  });

  it('returns red for negative changes', () => {
    expect(getChangeColor(-5.5)).toBe('text-red-500');
    expect(getChangeColor(-0.01)).toBe('text-red-500');
  });

  it('returns muted color for zero', () => {
    expect(getChangeColor(0)).toBe('text-muted-foreground');
  });

  it('returns muted color for null', () => {
    expect(getChangeColor(null)).toBe('text-muted-foreground');
  });
});

describe('formatTokenBalance', () => {
  it('formats token balances using formatNumber', () => {
    expect(formatTokenBalance('1234.5678')).toBe('1,234.57');
    expect(formatTokenBalance('0.123456789')).toBe('0.1235');
  });

  it('handles string numbers', () => {
    expect(formatTokenBalance('15.23')).toBe('15.23');
  });
});
