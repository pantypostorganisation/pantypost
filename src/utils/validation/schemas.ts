// src/utils/validation/schemas.ts

import { z } from 'zod';

/**
 * Common validation patterns and constraints
 */
const PATTERNS = {
  username: /^[a-zA-Z0-9_-]{3,30}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // Password: minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 number
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  // Allow letters, numbers, spaces, and common punctuation
  safeText: /^[a-zA-Z0-9\s\-.,!?'"()]+$/,
  // Price pattern: positive numbers with up to 2 decimal places
  price: /^\d+(\.\d{1,2})?$/,
  // Phone number pattern (international format)
  phone: /^\+?[\d\s-()]+$/,
  // Alphanumeric with spaces
  alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
};

/**
 * Common string sanitizers and transformers
 */
const sanitizers = {
  trim: (val: string) => val.trim(),
  lowercase: (val: string) => val.toLowerCase(),
  uppercase: (val: string) => val.toUpperCase(),
  removeHtml: (val: string) => val.replace(/<[^>]*>/g, ''),
  normalizeSpaces: (val: string) => val.replace(/\s+/g, ' ').trim(),
};

/**
 * Authentication schemas
 */
export const authSchemas = {
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(PATTERNS.username, 'Username can only contain letters, numbers, underscores, and hyphens')
    .transform(sanitizers.lowercase)
    .refine(
      (val) => !['admin', 'root', 'system', 'pantypost'].includes(val),
      'This username is reserved'
    ),

  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .transform(sanitizers.lowercase)
    .refine(
      (val) => !val.includes('+'),
      'Email aliases with + are not allowed'
    ),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
    .regex(
      PATTERNS.password,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),

  confirmPassword: z.string().min(1, 'Please confirm your password'),

  loginSchema: z.object({
    username: z.string().min(1, 'Username is required').transform(sanitizers.lowercase),
    password: z.string().min(1, 'Password is required'),
  }),

  signupSchema: z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(PATTERNS.username, 'Username can only contain letters, numbers, underscores, and hyphens')
      .transform(sanitizers.lowercase),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address')
      .transform(sanitizers.lowercase),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        PATTERNS.password,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['buyer', 'seller'], {
      required_error: 'Please select a role',
    }).nullable(),
    termsAccepted: z.boolean().refine((val) => val === true, 'You must agree to the terms'),
    ageVerified: z.boolean().refine((val) => val === true, 'You must confirm you are 18 or older'),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  }),
};

/**
 * User profile schemas
 */
export const profileSchemas = {
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters')
    .transform(sanitizers.normalizeSpaces)
    .refine(
      (val) => !/<[^>]*>/.test(val),
      'Display name cannot contain HTML'
    ),

  bio: z
    .string()
    .max(500, 'Bio must be at most 500 characters')
    .transform(sanitizers.normalizeSpaces)
    .optional(),

  location: z
    .string()
    .max(100, 'Location must be at most 100 characters')
    .transform(sanitizers.normalizeSpaces)
    .optional(),

  socialLinks: z.object({
    twitter: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
    instagram: z.string().url('Invalid Instagram URL').optional().or(z.literal('')),
    onlyfans: z.string().url('Invalid OnlyFans URL').optional().or(z.literal('')),
  }).optional(),

  profileUpdateSchema: z.object({
    displayName: z
      .string()
      .min(2, 'Display name must be at least 2 characters')
      .max(50, 'Display name must be at most 50 characters')
      .transform(sanitizers.normalizeSpaces),
    bio: z
      .string()
      .max(500, 'Bio must be at most 500 characters')
      .transform(sanitizers.normalizeSpaces)
      .optional(),
    location: z
      .string()
      .max(100, 'Location must be at most 100 characters')
      .transform(sanitizers.normalizeSpaces)
      .optional(),
    avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  }),
};

/**
 * Listing schemas
 */
export const listingSchemas = {
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be at most 100 characters')
    .transform(sanitizers.normalizeSpaces)
    .refine(
      (val) => !/<[^>]*>/.test(val),
      'Title cannot contain HTML'
    ),

  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be at most 2000 characters')
    .transform(sanitizers.normalizeSpaces)
    .refine(
      (val) => !/<[^>]*>/.test(val),
      'Description cannot contain HTML'
    ),

  price: z
    .string()
    .regex(PATTERNS.price, 'Invalid price format')
    .transform((val) => parseFloat(val))
    .refine((val) => val >= 0.01, 'Price must be at least $0.01')
    .refine((val) => val <= 10000, 'Price cannot exceed $10,000'),

  category: z.enum(['panties', 'bras', 'lingerie', 'socks', 'other'], {
    required_error: 'Please select a category',
  }),

  condition: z.enum(['new', 'worn_once', 'well_worn'], {
    required_error: 'Please select condition',
  }),

  size: z.enum(['xs', 's', 'm', 'l', 'xl', 'xxl', 'other'], {
    required_error: 'Please select a size',
  }),

  tags: z
    .array(z.string().max(30, 'Tag is too long'))
    .max(10, 'Maximum 10 tags allowed')
    .transform((tags) => tags.map((tag) => sanitizers.normalizeSpaces(tag)))
    .optional(),

  wearDuration: z
    .number()
    .min(0, 'Wear duration cannot be negative')
    .max(30, 'Wear duration cannot exceed 30 days')
    .optional(),

  images: z
    .array(z.string().url('Invalid image URL'))
    .min(1, 'At least one image is required')
    .max(10, 'Maximum 10 images allowed'),

  createListingSchema: z.object({
    title: z
      .string()
      .min(5, 'Title must be at least 5 characters')
      .max(100, 'Title must be at most 100 characters')
      .transform(sanitizers.normalizeSpaces),
    description: z
      .string()
      .min(20, 'Description must be at least 20 characters')
      .max(2000, 'Description must be at most 2000 characters')
      .transform(sanitizers.normalizeSpaces),
    price: z
      .number()
      .positive('Price must be positive')
      .min(0.01, 'Price must be at least $0.01')
      .max(10000, 'Price cannot exceed $10,000'),
    category: z.enum(['panties', 'bras', 'lingerie', 'socks', 'other']),
    condition: z.enum(['new', 'worn_once', 'well_worn']),
    size: z.enum(['xs', 's', 'm', 'l', 'xl', 'xxl', 'other']),
    tags: z.array(z.string()).optional(),
    wearDuration: z.number().optional(),
    images: z.array(z.string().url()).min(1, 'At least one image is required'),
    listingType: z.enum(['regular', 'auction']).default('regular'),
    auctionEndDate: z.string().datetime().optional(),
    startingBid: z.number().positive().optional(),
  }),
};

/**
 * Message schemas
 */
export const messageSchemas = {
  messageContent: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message is too long')
    .transform(sanitizers.normalizeSpaces)
    .refine(
      (val) => !/<script[^>]*>.*?<\/script>/gi.test(val),
      'Message cannot contain scripts'
    ),

  customRequest: z.object({
    title: z
      .string()
      .min(5, 'Title must be at least 5 characters')
      .max(100, 'Title must be at most 100 characters')
      .transform(sanitizers.normalizeSpaces),
    description: z
      .string()
      .min(20, 'Description must be at least 20 characters')
      .max(500, 'Description must be at most 500 characters')
      .transform(sanitizers.normalizeSpaces),
    price: z
      .number()
      .positive('Price must be positive')
      .min(5, 'Minimum price is $5')
      .max(1000, 'Maximum price is $1,000'),
  }),

  tipAmount: z
    .number()
    .positive('Tip amount must be positive')
    .min(1, 'Minimum tip is $1')
    .max(500, 'Maximum tip is $500'),
};

/**
 * Financial schemas
 */
export const financialSchemas = {
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format')
    .transform((val) => parseFloat(val))
    .refine((val) => val > 0, 'Amount must be positive')
    .refine((val) => val <= 10000, 'Amount cannot exceed $10,000'),

  withdrawAmount: z
    .number()
    .positive('Amount must be positive')
    .min(10, 'Minimum withdrawal is $20')
    .refine((val) => Math.round(val * 100) / 100 === val, 'Amount must have at most 2 decimal places'),

  depositAmount: z
    .number()
    .positive('Amount must be positive')
    .min(5, 'Minimum deposit is $5')
    .max(5000, 'Maximum deposit is $5,000')
    .refine((val) => Math.round(val * 100) / 100 === val, 'Amount must have at most 2 decimal places'),

  bankAccount: z.object({
    accountHolder: z
      .string()
      .min(2, 'Account holder name is required')
      .max(100, 'Account holder name is too long')
      .transform(sanitizers.normalizeSpaces),
    accountNumber: z
      .string()
      .min(8, 'Account number must be at least 8 characters')
      .max(20, 'Account number is too long')
      .regex(/^\d+$/, 'Account number must contain only digits'),
    routingNumber: z
      .string()
      .length(9, 'Routing number must be exactly 9 digits')
      .regex(/^\d{9}$/, 'Invalid routing number format'),
    bankName: z
      .string()
      .min(2, 'Bank name is required')
      .max(100, 'Bank name is too long')
      .transform(sanitizers.normalizeSpaces),
  }),

  paymentMethod: z.enum(['credit_card', 'debit_card', 'bank_transfer', 'wallet_balance'], {
    required_error: 'Please select a payment method',
  }),
};

/**
 * Address schemas
 */
export const addressSchemas = {
  shippingAddress: z.object({
    fullName: z
      .string()
      .min(2, 'Full name is required')
      .max(100, 'Full name is too long')
      .transform(sanitizers.normalizeSpaces),
    streetAddress: z
      .string()
      .min(5, 'Street address is required')
      .max(200, 'Street address is too long')
      .transform(sanitizers.normalizeSpaces),
    apartment: z
      .string()
      .max(50, 'Apartment/Suite is too long')
      .transform(sanitizers.normalizeSpaces)
      .optional(),
    city: z
      .string()
      .min(2, 'City is required')
      .max(100, 'City is too long')
      .transform(sanitizers.normalizeSpaces),
    state: z
      .string()
      .min(2, 'State/Province is required')
      .max(100, 'State/Province is too long')
      .transform(sanitizers.normalizeSpaces),
    zipCode: z
      .string()
      .min(3, 'ZIP/Postal code is required')
      .max(20, 'ZIP/Postal code is too long')
      .regex(/^[A-Z0-9\s-]+$/i, 'Invalid ZIP/Postal code format'),
    country: z
      .string()
      .min(2, 'Country is required')
      .max(100, 'Country is too long')
      .transform(sanitizers.normalizeSpaces),
    phone: z
      .string()
      .min(10, 'Phone number is required')
      .max(20, 'Phone number is too long')
      .regex(PATTERNS.phone, 'Invalid phone number format')
      .optional(),
  }),
};

/**
 * Search and filter schemas
 */
export const searchSchemas = {
  searchQuery: z
    .string()
    .max(100, 'Search query is too long')
    .transform(sanitizers.normalizeSpaces)
    .refine(
      (val) => !/<[^>]*>/.test(val),
      'Search query cannot contain HTML'
    ),

  priceRange: z.object({
    min: z.number().min(0, 'Minimum price cannot be negative').optional(),
    max: z.number().positive('Maximum price must be positive').optional(),
  }).refine(
    (data) => {
      if (data.min !== undefined && data.max !== undefined) {
        return data.min <= data.max;
      }
      return true;
    },
    { message: 'Minimum price cannot be greater than maximum price' }
  ),

  sortBy: z.enum(['newest', 'oldest', 'price_low', 'price_high', 'popular'], {
    required_error: 'Invalid sort option',
  }).default('newest'),
};

/**
 * Admin schemas
 */
export const adminSchemas = {
  banUser: z.object({
    userId: z.string().min(1, 'User ID is required'),
    reason: z
      .string()
      .min(10, 'Ban reason must be at least 10 characters')
      .max(500, 'Ban reason is too long')
      .transform(sanitizers.normalizeSpaces),
    duration: z.enum(['1_day', '7_days', '30_days', 'permanent'], {
      required_error: 'Please select ban duration',
    }),
  }),

  reportAction: z.object({
    action: z.enum(['dismiss', 'warn', 'ban', 'delete_content'], {
      required_error: 'Please select an action',
    }),
    notes: z
      .string()
      .min(10, 'Notes must be at least 10 characters')
      .max(500, 'Notes are too long')
      .transform(sanitizers.normalizeSpaces),
  }),
};

/**
 * File upload schemas
 */
export const fileSchemas = {
  imageUpload: z.object({
    file: z.instanceof(File, { message: 'Please select a file' })
      .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
      .refine(
        (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
        'Only JPEG, PNG, and WebP images are allowed'
      ),
  }),

  documentUpload: z.object({
    file: z.instanceof(File, { message: 'Please select a file' })
      .refine((file) => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
      .refine(
        (file) => ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(file.type),
        'Only JPEG, PNG, and PDF files are allowed'
      ),
  }),
};

/**
 * Helper function to validate data against a schema
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path.join('.')] = err.message;
        }
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
}

/**
 * Helper function to get field-level validation
 */
export function validateField<T>(
  schema: z.ZodSchema<T>,
  fieldName: string,
  value: unknown
): string | undefined {
  try {
    if (schema instanceof z.ZodObject) {
      const fieldSchema = schema.shape[fieldName as keyof typeof schema.shape];
      if (fieldSchema) {
        (fieldSchema as z.ZodTypeAny).parse(value);
      }
    }
    return undefined;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message;
    }
    return 'Validation failed';
  }
}
