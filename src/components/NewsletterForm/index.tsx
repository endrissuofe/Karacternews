'use client'

import React, { useActionState } from 'react'

import { subscribeToNewsletter, type NewsletterState } from '@/actions/subscribeToNewsletter'

const initialState: NewsletterState = { status: 'idle' }

// Footer newsletter capture (Increment 4). Server action + useActionState:
// progressively enhanced, so the form still submits without JavaScript.
export const NewsletterForm: React.FC = () => {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, initialState)

  return (
    <div className="max-w-md">
      <p className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-paper">
        The Karacter briefing
      </p>
      <p className="mb-3 font-serif text-sm text-paper/70">
        The stories that matter, straight to your inbox. No noise.
      </p>

      {state.status === 'ok' ? (
        <p role="status" className="font-mono text-[11px] uppercase tracking-wider text-paper">
          {state.message || 'You’re in. Watch your inbox.'}
        </p>
      ) : (
        <form action={formAction} className="flex flex-wrap gap-2">
          {/* Honeypot — hidden from real readers, tempting for bots. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="min-w-0 flex-1 rounded-md border border-paper/25 bg-transparent px-3 py-2 font-mono text-xs text-paper placeholder:text-paper/40 focus:outline-none focus:ring-2 focus:ring-amber"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-paper px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink hover:opacity-90 disabled:opacity-60"
          >
            {pending ? 'Signing up…' : 'Sign up'}
          </button>
          {state.status === 'error' && (
            <p role="alert" className="w-full font-mono text-[11px] uppercase tracking-wider text-scarlet">
              {state.message}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
