// src/utils/cn.ts
/**
 * Utility function for combining class names
 * Filters out falsy values and joins the remaining strings
 */
export function cn(...inputs: (string | undefined | null | false | 0 | '')[]) {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Alternative implementation with more features if needed
 * This version also handles arrays and objects
 */
export function cnAdvanced(...inputs: ClassValue[]): string {
  return inputs
    .flat()
    .filter((x) => typeof x === 'string' && x.length > 0)
    .join(' ');
}

type ClassValue = 
  | string 
  | undefined 
  | null 
  | false 
  | 0 
  | '' 
  | ClassValue[];