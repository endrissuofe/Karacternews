import type { CollectionBeforeChangeHook } from 'payload'

// Copies the system-parsed duration from the selected podcast-audio doc
// onto the episode (CLAUDE.md §6: episode duration is system-managed).
export const syncDurationFromAudio: CollectionBeforeChangeHook = async ({
  data,
  req,
  originalDoc,
}) => {
  const audioId = data.audio ?? originalDoc?.audio
  const audioChanged = data.audio !== undefined && data.audio !== originalDoc?.audio

  if (audioId && (audioChanged || data.duration == null)) {
    try {
      const audio = await req.payload.findByID({
        collection: 'podcast-audio',
        id: typeof audioId === 'object' ? audioId.id : audioId,
        depth: 0,
        req,
      })
      if (audio?.duration != null) {
        data.duration = audio.duration
      }
    } catch (err) {
      req.payload.logger.warn(`podcast-episodes: could not sync duration: ${String(err)}`)
    }
  }

  return data
}
