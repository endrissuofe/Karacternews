import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { isEditorOrAdmin } from '../access/isEditorOrAdmin'

// Episode audio files (Increment 5). Stored in Cloudflare R2 via the S3
// storage adapter configured in plugins/index.ts — we code only against
// the S3 API surface (CLAUDE.md §2). Falls back to local storage when R2
// env vars are absent (dev machines, CI).
//
// `duration` is system-managed: parsed from the file with music-metadata
// on upload, then copied onto episodes that select this file.
export const PodcastAudio: CollectionConfig = {
  slug: 'podcast-audio',
  labels: {
    singular: 'Podcast Audio',
    plural: 'Podcast Audio',
  },
  access: {
    create: isEditorOrAdmin,
    delete: isEditorOrAdmin,
    read: anyone,
    update: isEditorOrAdmin,
  },
  fields: [
    {
      name: 'duration',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Seconds. System-managed — parsed from the audio file on upload.',
      },
    },
  ],
  upload: {
    mimeTypes: ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav'],
    disableLocalStorage: false, // the storage plugin overrides this when R2 is configured
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (req.file?.data) {
          try {
            const { parseBuffer } = await import('music-metadata')
            const meta = await parseBuffer(req.file.data, { mimeType: req.file.mimetype })
            if (meta.format.duration) {
              data.duration = Math.round(meta.format.duration)
            }
          } catch (err) {
            req.payload.logger.warn(`podcast-audio: could not parse duration: ${String(err)}`)
          }
        }
        return data
      },
    ],
  },
}
