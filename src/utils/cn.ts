// src/utils/cn.ts
/**
 * Utility function for combining class names
 * Filters out falsy values and joins the remaining strings
 */
type PrimitiveClass = string | undefined | null | false | 0 | '';
type ClassValue = PrimitiveClass | readonly ClassValue[];

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

const collectClassNames = (values: readonly ClassValue[], acc: string[] = []): string[] => {
  for (const value of values) {
    if (!value) {
      continue;
    }

    if (Array.isArray(value)) {
      collectClassNames(value, acc);
      continue;
    }

    if (isNonEmptyString(value)) {
      acc.push(value);
    }
  }

  return acc;
};

export function cn(...inputs: PrimitiveClass[]): string {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Alternative implementation with more features if needed
 * This version also handles nested arrays and ignores non-string values
 */
export function cnAdvanced(...inputs: ClassValue[]): string {
  return collectClassNames(inputs).join(' ');
}
