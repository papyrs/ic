export const E8S_PER_ICP = BigInt(100000000);

/**
 * Initialize from a string. Accepted formats:
 *
 * 1234567.8901
 * 1'234'567.8901
 * 1,234,567.8901
 */
export const icpToE8s = (amount) => {
  // Remove all instances of "," and "'".
  amount = amount.trim().replace(/[,']/g, '');

  // Verify that the string is of the format 1234.5678
  const regexMatch = amount.match(/\d*(\.\d*)?/);
  if (!regexMatch || regexMatch[0] !== amount) {
    throw new Error('INVALID_FORMAT');
  }

  const [integral, fractional] = amount.split('.');

  let e8s = BigInt(0);

  if (integral) {
    try {
      e8s += BigInt(integral) * E8S_PER_ICP;
    } catch {
      throw new Error('INVALID_FORMAT');
    }
  }

  if (fractional) {
    if (fractional.length > 8) {
      throw new Error('FRACTIONAL_MORE_THAN_8_DECIMALS');
    }
    try {
      e8s += BigInt(fractional.padEnd(8, '0'));
    } catch {
      throw new Error('INVALID_FORMAT');
    }
  }

  return e8s;
};
