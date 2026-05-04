import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, token } = await req.json()

    if (!email || !token) {
      throw new Error("Email dan token wajib diisi.")
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Filkom Day 2026 <noreply@filkomday.com>',
        to: [email],
        subject: 'Kode Keamanan MFA - Dashboard Bendahara',
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
            <h2>Halo ${name || 'Bendahara'},</h2>
            <p>Untuk mengakses Dashboard Bendahara Filkom Day 2026, silakan masukkan kode verifikasi berikut:</p>
            <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${token}
            </div>
            <p>Kode ini bersifat rahasia dan jangan bagikan kepada siapa pun.</p>
            <p>Salam,<br>Tim Sistem Filkom Day 2026</p>
          </div>
        `,
      }),
    })

    const data = await res.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
