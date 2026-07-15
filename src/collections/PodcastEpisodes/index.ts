import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { isEditorOrAdmin } from '../../access/isEditorOrAdmin'
import { publishedEpisodeOrEditor } from './access/publishedEpisodeOrEditor'
import { syncDurationFromAudio } from './hooks/syncDurationFromAudio'
import { validateYouTubeUrl } from '../../utilities/youtube'

// Per CLAUDE.md §6 (Increment 5). Editors/admins manage episodes; the
// public reads only episodes whose publishedAt has passed (episodes have
// no draft workflow — publishedAt is the gate).
//
// Note: §6 doesn't list a slug for episodes, but the §7 route
// /podcasts/[show]/[ep] needs a URL identifier — slugField() added for that.
export const PodcastEpisodes: CollectionConfig = {
  slug: 'podcast-episodes',
  labels: {
    singular: 'Podcast Episode',
    plural: 'Podcast Episodes',
  },
  access: {
    create: isEditorOrAdmin,
    delete: isEditorOrAdmin,
    read: publishedEpisodeOrEditor,
    update: isEditorOrAdmin,
  },
  admin: {
    defaultColumns: ['title', 'show', 'publishedAt', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'show',
      type: 'relationship',
      relationTo: 'podcast-shows',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'showNotes',
      type: 'richText',
    },
    {
      name: 'audio',
      type: 'upload',
      relationTo: 'podcast-audio',
      required: true,
    },
    {
      // §5 exception (2026-07-12): the client also publishes episodes on
      // YouTube — optional link renders the embedded player on the
      // episode page. Embed only; we never host video.
      name: 'youtubeUrl',
      type: 'text',
      label: 'YouTube URL',
      validate: (value: string | null | undefined) => validateYouTubeUrl(value),
      admin: {
        description: 'Optional. If this episode is also on YouTube, paste the video link.',
      },
    },
    {
      name: 'duration',
      type: 'number',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Seconds. System-managed — copied from the audio file.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
        description: 'Episode is publicly visible once this time has passed.',
      },
    },
    slugField(),
  ],
  hooks: {
    beforeChange: [syncDurationFromAudio],
  },
}
