export const CURRENCY_SYMBOL =
  process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹';

export const CURRENCY_CODE =
  process.env.NEXT_PUBLIC_CURRENCY_CODE || "INR";

export const CURRENCY_LABEL =
  process.env.NEXT_PUBLIC_CURRENCY_LABEL || CURRENCY_SYMBOL;

/** Format a number as INR, e.g. ₹1,299 */
export function formatMoney(amount, options = {}) {
  const n = Number(amount || 0);
  const formatted = n.toLocaleString("en-IN", {
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
    ...options,
  });
  return `${CURRENCY_SYMBOL}${formatted}`;
}

export function formatMoneyFixed(amount, digits = 2) {
  return formatMoney(amount, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
