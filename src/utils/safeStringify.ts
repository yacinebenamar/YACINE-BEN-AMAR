/**
 * Safe JSON stringify that handles circular references gracefully.
 */
export function safeStringify(value: any): string {
  const seen = new WeakSet();
  try {
    return JSON.stringify(value, (key, val) => {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) {
          return '[Circular]';
        }
        seen.add(val);
      }
      return val;
    });
  } catch (error) {
    console.error('Error during safe stringify:', error);
    return '';
  }
}

/**
 * Deep equality check that uses safe stringification to avoid circular errors.
 */
export function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;

  if (typeof a !== 'object') {
    if (typeof a === 'number' && isNaN(a) && isNaN(b)) return true;
    return false;
  }

  return safeStringify(a) === safeStringify(b);
}
