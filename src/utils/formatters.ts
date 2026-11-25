import { WarrantyDetails, WarrantyStatus, WarrantyUnit } from '../types';

/**
 * Formats a numeric value into standard Indian Currency representation (e.g. ₹48,990)
 */
export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into a human readable format (e.g. 14 Oct 2024)
 */
export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Computes warranty status, expiration dates, days remaining, and progress percentage.
 * Supports exact days via optional warrantyDays, or months via warrantyMonths.
 * Reference date can be injected for deterministic unit testing.
 */
export function calculateWarranty(
  purchaseDateStr: string,
  warrantyMonths: number,
  extendedMonths?: number,
  referenceDate: Date = new Date(),
  warrantyDays?: number
): WarrantyDetails {
  if (!purchaseDateStr) {
    return {
      status: 'expired',
      statusLabel: 'No Date',
      expiryDate: '',
      formattedExpiryDate: 'N/A',
      daysRemaining: 0,
      percentageElapsed: 100,
      isExpiringSoon: false,
      isExpired: true,
    };
  }

  const [pYear, pMonth, pDay] = purchaseDateStr.split('-').map(Number);
  const purchaseDate = new Date(pYear, pMonth - 1, pDay);

  // Expiration date: use exact days if provided, otherwise months
  const expiryDateObj = new Date(pYear, pMonth - 1, pDay);
  if (warrantyDays !== undefined && warrantyDays >= 0) {
    expiryDateObj.setDate(expiryDateObj.getDate() + warrantyDays);
  } else {
    expiryDateObj.setMonth(expiryDateObj.getMonth() + warrantyMonths);
  }

  // Normalize reference date to midnight
  const refMidnight = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  const expiryMidnight = new Date(
    expiryDateObj.getFullYear(),
    expiryDateObj.getMonth(),
    expiryDateObj.getDate()
  );

  const purchaseMidnight = new Date(
    purchaseDate.getFullYear(),
    purchaseDate.getMonth(),
    purchaseDate.getDate()
  );

  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.max(1, Math.round((expiryMidnight.getTime() - purchaseMidnight.getTime()) / msPerDay));
  const daysRemaining = Math.round((expiryMidnight.getTime() - refMidnight.getTime()) / msPerDay);

  const daysElapsed = totalDays - daysRemaining;
  const percentageElapsed = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));

  let status: WarrantyStatus;
  let statusLabel: string;
  let isExpiringSoon = false;
  let isExpired = false;

  if (daysRemaining < 0) {
    status = 'expired';
    statusLabel = 'Expired';
    isExpired = true;
  } else if (daysRemaining <= 60) {
    status = 'expiring_soon';
    statusLabel = daysRemaining === 0 ? 'Expires today' : `${daysRemaining}d left`;
    isExpiringSoon = true;
  } else {
    status = 'active';
    statusLabel = 'Active';
  }

  // Format expiry date string
  const expYear = expiryDateObj.getFullYear();
  const expMonth = String(expiryDateObj.getMonth() + 1).padStart(2, '0');
  const expDay = String(expiryDateObj.getDate()).padStart(2, '0');
  const expiryDate = `${expYear}-${expMonth}-${expDay}`;
  const formattedExpiryDate = formatDate(expiryDate);

  let extendedExpiryDate: string | undefined;
  let extendedDaysRemaining: number | undefined;

  if (extendedMonths && extendedMonths > 0) {
    const extObj = new Date(pYear, pMonth - 1, pDay);
    extObj.setMonth(extObj.getMonth() + extendedMonths);
    const extMidnight = new Date(extObj.getFullYear(), extObj.getMonth(), extObj.getDate());
    extendedDaysRemaining = Math.round((extMidnight.getTime() - refMidnight.getTime()) / msPerDay);
    const extYear = extObj.getFullYear();
    const extMonth = String(extObj.getMonth() + 1).padStart(2, '0');
    const extDay = String(extObj.getDate()).padStart(2, '0');
    extendedExpiryDate = formatDate(`${extYear}-${extMonth}-${extDay}`);
  }

  return {
    status,
    statusLabel,
    expiryDate,
    formattedExpiryDate,
    daysRemaining,
    percentageElapsed,
    isExpiringSoon,
    isExpired,
    extendedExpiryDate,
    extendedDaysRemaining,
  };
}

/**
 * Computes expiry date and remaining days for a custom duration in days, months, or years.
 */
export function calculateDurationExpiry(
  purchaseDateStr: string,
  duration: number,
  unit: WarrantyUnit,
  referenceDate: Date = new Date()
): { expiryDate: string; formattedExpiryDate: string; daysRemaining: number; isExpired: boolean } {
  if (!purchaseDateStr || duration < 0) {
    return { expiryDate: '', formattedExpiryDate: 'N/A', daysRemaining: 0, isExpired: true };
  }
  const [pYear, pMonth, pDay] = purchaseDateStr.split('-').map(Number);
  const expObj = new Date(pYear, pMonth - 1, pDay);
  if (unit === 'days') {
    expObj.setDate(expObj.getDate() + duration);
  } else if (unit === 'months') {
    expObj.setMonth(expObj.getMonth() + duration);
  } else {
    expObj.setFullYear(expObj.getFullYear() + duration);
  }

  const refMidnight = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const expMidnight = new Date(expObj.getFullYear(), expObj.getMonth(), expObj.getDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.round((expMidnight.getTime() - refMidnight.getTime()) / msPerDay);

  const y = expObj.getFullYear();
  const m = String(expObj.getMonth() + 1).padStart(2, '0');
  const d = String(expObj.getDate()).padStart(2, '0');
  const expiryDate = `${y}-${m}-${d}`;

  return {
    expiryDate,
    formattedExpiryDate: formatDate(expiryDate),
    daysRemaining,
    isExpired: daysRemaining < 0,
  };
}

export function formatDurationLabel(duration: number, unit: WarrantyUnit): string {
  const unitLabel =
    unit === 'days'
      ? duration === 1 ? 'Day' : 'Days'
      : unit === 'months'
      ? duration === 1 ? 'Month' : 'Months'
      : duration === 1 ? 'Year' : 'Years';
  return `${duration} ${unitLabel}`;
}

/**
 * Generates an iCalendar (.ics) event reminding the user 7 days before warranty expiry.
 */
export function generateWarrantyIcs(
  productName: string,
  brand: string,
  expiryDate: string,
  helpline?: string
): string {
  const [y, m, d] = expiryDate.split('-').map(Number);
  const reminderDate = new Date(y, m - 1, d);
  reminderDate.setDate(reminderDate.getDate() - 7);
  const pad = (n: number) => String(n).padStart(2, '0');
  const startStr = `${reminderDate.getFullYear()}${pad(reminderDate.getMonth() + 1)}${pad(reminderDate.getDate())}`;
  const endObj = new Date(reminderDate);
  endObj.setDate(endObj.getDate() + 1);
  const endStr = `${endObj.getFullYear()}${pad(endObj.getMonth() + 1)}${pad(endObj.getDate())}`;
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const desc = `Standard warranty for ${brand} ${productName} expires on ${expiryDate}.${helpline ? ` Customer Care: ${helpline}` : ''}`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HomeVault India//Warranty Reminder//EN',
    'BEGIN:VEVENT',
    `UID:hmv-${Date.now()}@homevault.local`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART;VALUE=DATE:${startStr}`,
    `DTEND;VALUE=DATE:${endStr}`,
    `SUMMARY:Warranty Expiring Soon: ${brand} ${productName}`,
    `DESCRIPTION:${desc}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export const CATEGORY_OPTIONS: { id: string; label: string; icon: string }[] = [
  { id: 'kitchen', label: 'Kitchen & Refrigerator', icon: 'Refrigerator' },
  { id: 'cooling', label: 'Air Conditioning & Cooling', icon: 'AirVent' },
  { id: 'laundry', label: 'Washing Machine & Laundry', icon: 'Shirt' },
  { id: 'entertainment', label: 'Television & Audio', icon: 'Tv' },
  { id: 'computing', label: 'Computers & Mobiles', icon: 'Laptop' },
  { id: 'water_air', label: 'Water & Air Purifiers', icon: 'Droplets' },
  { id: 'small_appliances', label: 'Small Appliances', icon: 'Coffee' },
  { id: 'other', label: 'Other Household Items', icon: 'Box' },
];

export const POPULAR_INDIAN_BRANDS = [
  'LG',
  'Samsung',
  'Daikin',
  'IFB',
  'Voltas',
  'Kent',
  'Whirlpool',
  'Sony',
  'Apple',
  'Havells',
  'Bosch',
  'Philips',
  'Bajaj',
  'Mi / Xiaomi',
  'OnePlus',
  'Dyson',
  'Blue Star',
  'Eureka Forbes',
  'Godrej',
  'Panasonic',
];

export const POPULAR_INDIAN_RETAILERS = [
  'Reliance Digital',
  'Croma',
  'Vijay Sales',
  'Amazon India',
  'Flipkart',
  'Brand Authorized Store',
  'Local Electronics Dealer',
  'Tata CLiQ',
];
