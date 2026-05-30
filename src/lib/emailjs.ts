// EmailJS REST integration. Sends a welcome/acknowledgement email
// from the browser without exposing any private key. The public key,
// service id and template id are all safe to ship to the client —
// that's by design of EmailJS.

const EMAILJS_SERVICE_ID = 'service_7lksr1v';
const EMAILJS_TEMPLATE_ID = 'template_or0as8q';
const EMAILJS_PUBLIC_KEY = 'nqfdU9OQs5RQp70s8';

export interface WelcomeEmailParams {
  email: string;
  name?: string;
  role?: string;
}

/**
 * Fire-and-forget welcome email via EmailJS. Never throws — failures
 * are logged so the signup flow is never blocked.
 */
export function sendWelcomeEmail({ email, name, role }: WelcomeEmailParams): void {
  const displayName = name?.trim() || email.split('@')[0];
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';

  const payload = {
    service_id: EMAILJS_SERVICE_ID,
    template_id: EMAILJS_TEMPLATE_ID,
    user_id: EMAILJS_PUBLIC_KEY,
    template_params: {
      // Common EmailJS template variable names — include several aliases
      // so the template works regardless of which placeholder it uses.
      to_email: email,
      user_email: email,
      email,
      to_name: displayName,
      user_name: displayName,
      name: displayName,
      role: roleLabel,
      app_name: 'AlertSakha',
      dashboard_url: 'https://alertsakha.lovable.app/dashboard',
      message: `Welcome to AlertSakha, ${displayName}! Your account (${email}) has been created as ${roleLabel}. You can now access your dashboard.`,
    },
  };

  // Non-blocking: don't await, don't throw.
  fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('EmailJS send failed', res.status, text);
      }
    })
    .catch((err) => console.error('EmailJS send error', err));
}