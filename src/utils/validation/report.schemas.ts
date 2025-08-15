// Zod schemas + safe coercion for admin reports
// Validates and sanitizes fields used by ReportCard.
// We keep this small and focused on what the component needs.

import { z } from 'zod';
import { sanitizeStrict, sanitizeUsername } from '@/utils/security/sanitization';

const SeveritySchema = z.enum(['low', 'medium', 'high', 'critical']).optional();
const CategorySchema = z
  .enum(['harassment', 'spam', 'inappropriate_content', 'scam', 'other'])
  .optional();

export const ReportSchema = z.object({
  reporter: z.string().min(1).max(64),
  reportee: z.string().min(1).max(64),
  severity: SeveritySchema,
  category: CategorySchema,
  date: z.union([z.string(), z.number(), z.date()]),
  processed: z.boolean().optional().default(false),
  messages: z.array(z.any()).optional().default([]),
});

export type SafeReport = z.infer<typeof ReportSchema>;

function toSafeString(value: unknown, max = 120): string {
  const s =
    typeof value === 'string'
      ? value
      : value == null
      ? ''
      : String(value);
  return sanitizeStrict(s).slice(0, max);
}

/**
 * Coerce unknown input into a SafeReport with sanitized fields.
 * - reporter/reportee treated as usernames -> sanitizeUsername
 * - unknown severities/categories -> undefined (component will show 'Unknown' / 'uncategorized')
 * - messages coerced to array (ignored content in ReportCard; used only for count)
 */
export function coerceReport(input: unknown): SafeReport {
  const raw = (input ?? {}) as Record<string, unknown>;

  // Reporter & reportee are usernames in your app; use stricter username sanitizer.
  const reporter = sanitizeUsername(toSafeString(raw.reporter, 64)) || 'unknown';
  const reportee = sanitizeUsername(toSafeString(raw.reportee, 64)) || 'unknown';

  // Try enums; if invalid, leave undefined so UI shows safe defaults.
  const severityParsed = SeveritySchema.safeParse(raw.severity);
  const categoryParsed = CategorySchema.safeParse(raw.category);

  // Trust Zod to normalize date type; if invalid, keep original for the component to render 'Unknown date'
  const dateCandidate = raw.date ?? '';
  const processed = typeof raw.processed === 'boolean' ? raw.processed : false;
  const messages = Array.isArray(raw.messages) ? raw.messages : [];

  const candidate: Partial<SafeReport> = {
    reporter,
    reportee,
    severity: severityParsed.success ? severityParsed.data : undefined,
    category: categoryParsed.success ? categoryParsed.data : undefined,
    date: dateCandidate as SafeReport['date'],
    processed,
    messages,
  };

  // Final schema check to ensure shape is correct.
  const final = ReportSchema.safeParse(candidate);
  if (final.success) return final.data;

  // As last resort, return a minimal safe shape.
  return {
    reporter,
    reportee,
    severity: undefined,
    category: undefined,
    date: String(dateCandidate ?? ''),
    processed,
    messages,
  };
}
