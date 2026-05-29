import { z } from 'zod';

// Names: letters (incl. unicode), spaces, hyphens, apostrophes, periods. No digits or symbols.
const nameRegex = /^[\p{L}][\p{L}\s.'\-]{1,99}$/u;

export const fieldSchemas = {
  name: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be under 100 characters')
    .regex(nameRegex, 'Full name can only contain letters, spaces, hyphens and apostrophes'),

  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(255, 'Email is too long')
    .email('Enter a valid email address (e.g. name@example.com)'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be under 72 characters')
    .regex(/[A-Za-z]/, 'Password must include at least one letter')
    .regex(/[0-9]/, 'Password must include at least one number'),

  hotelName: z
    .string()
    .trim()
    .min(2, 'Hotel name must be at least 2 characters')
    .max(120, 'Hotel name is too long'),

  employeeId: z
    .string()
    .trim()
    .min(3, 'Employee ID must be at least 3 characters')
    .max(30, 'Employee ID is too long')
    .regex(/^[A-Za-z0-9\-_/]+$/, 'Employee ID can only contain letters, numbers, - _ /'),

  businessLicense: z
    .string()
    .trim()
    .min(3, 'License number must be at least 3 characters')
    .max(40, 'License number is too long')
    .regex(/^[A-Za-z0-9\-/]+$/, 'License number can only contain letters, numbers, - and /'),

  organizationName: z
    .string()
    .trim()
    .min(2, 'Organization name must be at least 2 characters')
    .max(120, 'Organization name is too long'),
};

export type FieldName = keyof typeof fieldSchemas;

export function validateField(field: FieldName, value: string): string | undefined {
  const result = fieldSchemas[field].safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}