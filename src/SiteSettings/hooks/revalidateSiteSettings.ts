import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

// The footer reads social links through getCachedGlobal('site-settings'),
// whose cache only refreshes when this tag is revalidated.
export const revalidateSiteSettings: GlobalAfterChangeHook = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) revalidateTag('global_site-settings', 'max')

  return doc
}
