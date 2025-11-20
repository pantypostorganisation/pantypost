import { format } from 'date-fns';

const MILLISECONDS_IN_MINUTE = 60_000;

export type DateInput = Date | string | number;

function toDate(input: DateInput): Date {
  return input instanceof Date ? input : new Date(input);
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'shortOffset'
  });

  const parts = formatter.formatToParts(date);
  const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value ?? 'GMT+0';
  const match = timeZoneName.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);

  if (!match) {
    return 0;
  }

  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = match[3] ? Number(match[3]) : 0;

  return sign * (hours * 60 + minutes);
}

function getTimeZoneAbbreviation(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  return formatter.formatToParts(date).find(part => part.type === 'timeZoneName')?.value ?? timeZone;
}

export function toZonedTime(input: DateInput, timeZone: string): Date {
  const date = toDate(input);
  const offsetMinutes = getTimeZoneOffsetMinutes(date, timeZone);
  return new Date(date.getTime() + offsetMinutes * MILLISECONDS_IN_MINUTE);
}

export function fromZonedTime(input: DateInput, timeZone: string): Date {
  const date = toDate(input);
  const offsetMinutes = getTimeZoneOffsetMinutes(date, timeZone);
  return new Date(date.getTime() - offsetMinutes * MILLISECONDS_IN_MINUTE);
}

export function formatInTimeZone(input: DateInput, timeZone: string, pattern: string): string {
  const date = toDate(input);
  const zonedDate = toZonedTime(date, timeZone);

  if (pattern.includes('zzz')) {
    const abbreviation = getTimeZoneAbbreviation(date, timeZone);
    const literalAbbreviation = `'${abbreviation.replace(/'/g, "''")}'`;
    const adjustedPattern = pattern.replace(/zzz/g, literalAbbreviation);
    return format(zonedDate, adjustedPattern);
  }

  return format(zonedDate, pattern);
}
