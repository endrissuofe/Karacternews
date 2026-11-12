import type { EmailAdapter, SendEmailOptions } from 'payload'

// Payload email through Brevo's transactional API (CLAUDE.md §2: Brevo free
// tier). Plain fetch against the HTTP API, so no SDK or SMTP dependency.
// Payload uses this for password resets and any future system email.

type Address = { address: string; name?: string }
type Recipient = string | Address

const parseAddress = (value: Recipient): Address => {
  if (typeof value !== 'string') return { address: value.address, name: value.name || undefined }
  // `"Name" <a@b.c>` or `Name <a@b.c>` or a bare address
  const match = value.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/)
  return match
    ? { address: match[2].trim(), name: match[1].trim() || undefined }
    : { address: value.trim() }
}

const toList = (value: SendEmailOptions['to']): { email: string; name?: string }[] => {
  if (!value) return []
  const items = (Array.isArray(value) ? value : [value]) as Recipient[]
  return items
    .flatMap((item) =>
      // A single string may hold several comma-separated addresses.
      typeof item === 'string' && !item.includes('<') ? item.split(',') : [item],
    )
    .map(parseAddress)
    .filter((a) => a.address)
    .map((a) => ({ email: a.address, ...(a.name ? { name: a.name } : {}) }))
}

export const brevoAdapter =
  ({
    apiKey,
    defaultFromAddress,
    defaultFromName,
  }: {
    apiKey: string
    defaultFromAddress: string
    defaultFromName: string
  }): EmailAdapter =>
  () => ({
    name: 'brevo',
    defaultFromAddress,
    defaultFromName,
    sendEmail: async (message) => {
      const from = message.from
        ? parseAddress(message.from as Recipient)
        : { address: defaultFromAddress, name: defaultFromName }

      const replyTo = message.replyTo ? toList(message.replyTo as SendEmailOptions['to'])[0] : null

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { email: from.address, name: from.name || defaultFromName },
          to: toList(message.to),
          ...(message.cc ? { cc: toList(message.cc as SendEmailOptions['to']) } : {}),
          ...(message.bcc ? { bcc: toList(message.bcc as SendEmailOptions['to']) } : {}),
          ...(replyTo ? { replyTo } : {}),
          subject: message.subject || '(no subject)',
          ...(message.html ? { htmlContent: String(message.html) } : {}),
          ...(message.text ? { textContent: String(message.text) } : {}),
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        // Status and Brevo's error code only: never log addresses or content (§3.9).
        throw new Error(`Brevo email failed: ${res.status} ${body?.code ?? ''}`.trim())
      }

      return res.json()
    },
  })
