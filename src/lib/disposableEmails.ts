// Common disposable / temporary email domains we reject at sign-up.
// Not exhaustive but covers the major throwaway providers.
export const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  'ellbit.com',
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  '10minutemail.com',
  '10minutemail.net',
  'guerrillamail.com',
  'guerrillamail.net',
  'sharklasers.com',
  'yopmail.com',
  'trashmail.com',
  'trashmail.net',
  'dispostable.com',
  'getnada.com',
  'maildrop.cc',
  'fakeinbox.com',
  'throwawaymail.com',
  'mintemail.com',
  'mohmal.com',
  'mailnesia.com',
  'spam4.me',
  'tempinbox.com',
  'tempr.email',
  'discard.email',
  'inboxbear.com',
  'mailcatch.com',
  'mytrashmail.com',
]);

const DISPOSABLE_PATTERNS = [
  /tempmail/i,
  /tempinbox/i,
  /throwaway/i,
  /trashmail/i,
  /10minute/i,
  /guerrilla/i,
  /mailinator/i,
  /yopmail/i,
  /fakeinbox/i,
  /\bdisposable\b/i,
];

export function isDisposableEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1];
  if (!domain) return false;
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return true;
  return DISPOSABLE_PATTERNS.some((rx) => rx.test(domain));
}