'use server'

// Newsletter capture → Brevo contacts API (Increment 4; CLAUDE.md §2 locked
// email decision: Brevo free tier, capture only — no sending at scale yet).
// The API key stays server-side; the client only ever sees ok/error.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type NewsletterState = {
  status: 'idle' | 'ok' | 'error'
  message?: string
}

export async function subscribeToNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const email = String(formData.get('email') || '')
    .trim()
    .toLowerCase()

  // Honeypot: real readers never fill this hidden field.
  if (formData.get('website')) {
    return { status: 'ok' }
  }

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { status: 'error', message: 'Please enter a valid email address.' }
  }

  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.error('subscribeToNewsletter: BREVO_API_KEY is not set')
    return { status: 'error', message: 'Signups are temporarily unavailable. Try again later.' }
  }

  const listId = Number(process.env.BREVO_LIST_ID)

  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        email,
        updateEnabled: true,
        ...(Number.isFinite(listId) && listId > 0 ? { listIds: [listId] } : {}),
      }),
    })

    // 201 created, 204 updated existing contact — both are success.
    if (res.ok || res.status === 204) {
      return { status: 'ok', message: 'You’re in. Watch your inbox.' }
    }

    const body = await res.json().catch(() => null)
    // Brevo returns duplicate_parameter when the contact already exists
    // and updateEnabled didn't apply — treat as success for the reader.
    if (body && body.code === 'duplicate_parameter') {
      return { status: 'ok', message: 'You’re already subscribed.' }
    }

    console.error(`subscribeToNewsletter: Brevo responded ${res.status}`, body?.code)
    return { status: 'error', message: 'Something went wrong. Please try again.' }
  } catch (err) {
    console.error('subscribeToNewsletter: request failed', err)
    return { status: 'error', message: 'Something went wrong. Please try again.' }
  }
}
