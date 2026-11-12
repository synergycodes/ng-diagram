import { FIELD_MESSAGES, isFreeEmailDomain } from '../data/contact';

export type FieldName = keyof typeof FIELD_MESSAGES;

export const FIELD_NAMES = Object.keys(FIELD_MESSAGES) as FieldName[];

/** Something, `@`, and a domain with at least one dot. */
const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

/** The error message of a field value (trimmed first), or null when the value is valid. */
export function fieldError(name: FieldName, raw: string): string | null {
  const value = raw.trim();
  if (!value) {
    return FIELD_MESSAGES[name].missing;
  }
  if (name === 'email') {
    if (!EMAIL.test(value)) {
      return FIELD_MESSAGES.email.format;
    }
    if (isFreeEmailDomain(value)) {
      return FIELD_MESSAGES.email.freeDomain;
    }
  }
  return null;
}
