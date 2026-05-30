import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

interface Payload {
  email: string
  name?: string
  role?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { email, name, role } = (await req.json()) as Payload
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'email required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const displayName = name?.trim() || email.split('@')[0]
    const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User'

    const html = `
<!doctype html>
<html><body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);border-radius:16px;padding:24px;color:#fff">
      <h1 style="margin:0;font-size:22px;font-weight:700">Welcome to AlertSakha, ${displayName}!</h1>
      <p style="margin:8px 0 0;opacity:.9;font-size:14px">Rapid Crisis Response System</p>
    </div>

    <div style="padding:24px 4px">
      <h2 style="font-size:16px;margin:0 0 8px">Account acknowledgement</h2>
      <p style="font-size:14px;line-height:1.6;color:#334155;margin:0 0 16px">
        Your account for <strong>${email}</strong> has been created and verified.
        You are signed in as <strong>${roleLabel}</strong>. No further email confirmation is required.
      </p>

      <h3 style="font-size:14px;margin:20px 0 6px">Safe-operating credentials overview</h3>
      <ul style="font-size:13px;line-height:1.7;color:#334155;padding-left:18px;margin:0">
        <li>Never share your password or one-time codes with anyone.</li>
        <li>Elevated roles (Staff, Manager, Security) remain pending until an admin approves your request.</li>
        <li>All emergency reports, chats and incident data are logged for audit.</li>
      </ul>

      <h3 style="font-size:14px;margin:20px 0 6px">Next steps</h3>
      <ol style="font-size:13px;line-height:1.7;color:#334155;padding-left:18px;margin:0">
        <li>Open your dashboard to view active alerts.</li>
        <li>Complete your profile (contact number, emergency contact, ID).</li>
        <li>Enable multi-factor authentication in Security Settings.</li>
      </ol>

      <div style="margin-top:24px">
        <a href="https://alertsakha.lovable.app/dashboard"
           style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px">
          Go to Dashboard
        </a>
      </div>

      <p style="font-size:12px;color:#94a3b8;margin:32px 0 0">
        You're receiving this because an account was created with this email on AlertSakha.
      </p>
    </div>
  </div>
</body></html>`.trim()

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'AlertSakha <onboarding@resend.dev>',
        to: [email],
        subject: 'Welcome to AlertSakha — Account Acknowledgement',
        html,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'resend_failed', details: data }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true, id: data?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})