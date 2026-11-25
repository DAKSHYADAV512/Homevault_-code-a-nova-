import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatINR,
  formatDate,
  calculateWarranty,
  calculateDurationExpiry,
  formatDurationLabel,
  generateWarrantyIcs,
} from './formatters';

test('formatINR formats numbers with Indian Rupee symbol and Indian grouping', () => {
  assert.equal(formatINR(0), '₹0');
  // en-IN format for 48990 should include ₹48,990
  const formatted = formatINR(48990);
  assert.ok(formatted.includes('₹'));
  assert.ok(formatted.includes('48,990'));

  const formattedLarge = formatINR(145000);
  assert.ok(formattedLarge.includes('1,45,000') || formattedLarge.includes('145,000'));
});

test('formatDate correctly parses and formats YYYY-MM-DD', () => {
  const formatted = formatDate('2024-05-15');
  assert.ok(formatted.includes('2024'));
  assert.ok(formatted.includes('May'));
  assert.ok(formatted.includes('15'));
});

test('calculateWarranty accurately identifies active warranties', () => {
  // Reference date: 2026-01-01
  const refDate = new Date(2026, 0, 1);
  // Purchase date: 2025-10-01, 12 months warranty -> expires 2026-10-01 (approx 273 days left)
  const result = calculateWarranty('2025-10-01', 12, undefined, refDate);
  assert.equal(result.status, 'active');
  assert.equal(result.isExpired, false);
  assert.equal(result.isExpiringSoon, false);
  assert.ok(result.daysRemaining > 60);
});

test('calculateWarranty accurately identifies expiring soon warranties (<= 60 days)', () => {
  // Reference date: 2026-05-01
  const refDate = new Date(2026, 4, 1);
  // Purchase date: 2025-06-01, 12 months warranty -> expires 2026-06-01 (~31 days left)
  const result = calculateWarranty('2025-06-01', 12, undefined, refDate);
  assert.equal(result.status, 'expiring_soon');
  assert.equal(result.isExpiringSoon, true);
  assert.equal(result.isExpired, false);
  assert.ok(result.daysRemaining <= 60 && result.daysRemaining >= 0);
});

test('calculateWarranty accurately identifies expired warranties', () => {
  // Reference date: 2026-11-01
  const refDate = new Date(2026, 10, 1);
  // Purchase date: 2024-01-01, 12 months warranty -> expires 2025-01-01 (negative days)
  const result = calculateWarranty('2024-01-01', 12, undefined, refDate);
  assert.equal(result.status, 'expired');
  assert.equal(result.isExpired, true);
  assert.ok(result.daysRemaining < 0);
});

test('calculateWarranty handles extended warranty component', () => {
  const refDate = new Date(2026, 0, 1);
  // Purchase date: 2025-01-01, 12m standard + 120m (10y) compressor
  const result = calculateWarranty('2025-01-01', 12, 120, refDate);
  assert.ok(result.extendedDaysRemaining && result.extendedDaysRemaining > 0);
  assert.ok(result.extendedExpiryDate && result.extendedExpiryDate.includes('2035'));
});

test('calculateWarranty supports exact custom days via warrantyDays', () => {
  const refDate = new Date(2026, 0, 11); // 2026-01-11
  // Purchase date: 2026-01-01, 45 days warranty -> expires 2026-02-15 (35 days left)
  const result = calculateWarranty('2026-01-01', 1, undefined, refDate, 45);
  assert.equal(result.expiryDate, '2026-02-15');
  assert.equal(result.daysRemaining, 35);
  assert.equal(result.status, 'expiring_soon');
});

test('calculateDurationExpiry and formatDurationLabel handle days, months, and years', () => {
  const refDate = new Date(2026, 0, 1);
  const daysExp = calculateDurationExpiry('2026-01-01', 90, 'days', refDate);
  assert.equal(daysExp.expiryDate, '2026-04-01');
  assert.equal(daysExp.isExpired, false);

  const yearsExp = calculateDurationExpiry('2024-01-01', 5, 'years', refDate);
  assert.equal(yearsExp.expiryDate, '2029-01-01');
  assert.equal(yearsExp.isExpired, false);

  assert.equal(formatDurationLabel(45, 'days'), '45 Days');
  assert.equal(formatDurationLabel(1, 'years'), '1 Year');
  assert.equal(formatDurationLabel(18, 'months'), '18 Months');
});

test('generateWarrantyIcs creates valid iCalendar reminder 7 days prior to expiry', () => {
  const ics = generateWarrantyIcs('Split AC', 'Daikin', '2026-06-15', '1860-180-3900');
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20260608'));
  assert.ok(ics.includes('SUMMARY:Warranty Expiring Soon: Daikin Split AC'));
  assert.ok(ics.includes('1860-180-3900'));
  assert.ok(ics.includes('END:VCALENDAR'));
});
