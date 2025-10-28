// src/types/type-utils.ts

/**
 * Utility types for common patterns
 */

// Basic utility types
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export type DeepReadonly<T> = T extends object ? {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
} : T;

export type Nullable<T> = T | null;

export type ValueOf<T> = T[keyof T];

export type OmitMultiple<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Function types
export type AsyncFunction<T = void> = () => Promise<T>;
export type AsyncFunctionWithArgs<TArgs extends any[], TReturn = void> = (...args: TArgs) => Promise<TReturn>;

// Event handler types
export type ChangeHandler<T = string> = (value: T) => void;
export type FormChangeHandler = React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
export type SubmitHandler<T = void> = (data: T) => void | Promise<void>;
export type ClickHandler = React.MouseEventHandler<HTMLElement>;
export type KeyHandler = React.KeyboardEventHandler<HTMLElement>;

// Component prop types
export type PropsWithClassName<P = {}> = P & {
  className?: string;
};

export type PropsWithChildren<P = {}> = P & {
  children?: React.ReactNode;
};

export type PropsWithRef<P = {}, T = HTMLElement> = P & {
  ref?: React.Ref<T>;
};

// Result type for operations that can fail
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Discriminated union helper
export type DiscriminatedUnion<T, K extends keyof T, V extends T[K]> = 
  T extends Record<K, V> ? T : never;

// Extract promise type
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

// Extract array element type
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

// Loading state
export interface LoadingState<T> {
  isLoading: boolean;
  data?: T;
  error?: Error;
}

// Pagination state
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Sort state
export interface SortState<T = string> {
  field: T;
  order: 'asc' | 'desc';
}

// Filter state
export interface FilterState<T = Record<string, any>> {
  filters: T;
  isActive: boolean;
}

// Selection state
export interface SelectionState<T> {
  selected: Set<T>;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
}

// Other advanced types...
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;