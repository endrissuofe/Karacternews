import React from 'react'

import { getSections } from '@/utilities/getSections'

import { SectionNavClient } from './Client'

// Section bar under the header. It scrolls with the page rather than
// sticking, so the sticky header stays one row tall on phones.
export async function SectionNav() {
  const sections = await getSections()

  if (sections.length === 0) return null

  return <SectionNavClient sections={sections} />
}
