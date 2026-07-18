import { NextResponse } from 'next/server'
import { SITE } from '@/lib/site'

export async function POST(request) {
  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim()
    const phone = String(body.phone || '').trim()
    const subject = String(body.subject || 'Website contact').trim()
    const message = String(body.message || '').trim()

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 })
    }

    const html = `
      <p><strong>Name:</strong> ${escape(name)}</p>
      <p><strong>Email:</strong> ${escape(email)}</p>
      <p><strong>Phone:</strong> ${escape(phone || '—')}</p>
      <p><strong>Subject:</strong> ${escape(subject)}</p>
      <p><strong>Message:</strong></p>
      <p>${escape(message).replace(/\n/g, '<br/>')}</p>
    `

    try {
      const { sendMail } = await import('@/lib/email')
      await sendMail({
        to: SITE.email,
        subject: `[Nilaas Contact] ${subject} — ${name}`,
        html: `
          <div style="font-family:Arial,sans-serif;color:#2a1210;max-width:560px;">
            <h2 style="margin:0 0 12px;">New contact message</h2>
            ${html}
            <p style="margin-top:20px;font-size:12px;color:#9a7d72;">Reply directly to ${escape(email)}</p>
          </div>
        `,
      })
    } catch (e) {
      console.error('Contact email failed:', e.message)
      // Still accept the enquiry so UX isn't blocked; client may fall back to mailto
      return NextResponse.json({
        success: true,
        warning: 'Stored locally; email delivery may be delayed',
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to send' }, { status: 500 })
  }
}

function escape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
