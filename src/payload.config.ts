import { postgresAdapter } from '@payloadcms/db-postgres'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Articles } from './collections/Articles'
import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { PodcastAudio } from './collections/PodcastAudio'
import { PodcastEpisodes } from './collections/PodcastEpisodes'
import { PodcastShows } from './collections/PodcastShows'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { SiteSettings } from './SiteSettings/config'
import { plugins } from './plugins'
import { publishScheduledArticles } from './jobs/publishScheduledArticles'
import { defaultLexical } from '@/fields/defaultLexical'
import { brevoAdapter } from './email/brevoAdapter'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Email (password resets) goes through Brevo once both the API key and a
// sender verified in Brevo are set. Until then Payload falls back to logging
// emails to the console, so nothing breaks while it is not configured.
const email =
  process.env.BREVO_API_KEY && process.env.EMAIL_FROM_ADDRESS
    ? brevoAdapter({
        apiKey: process.env.BREVO_API_KEY,
        defaultFromAddress: process.env.EMAIL_FROM_ADDRESS,
        defaultFromName: process.env.EMAIL_FROM_NAME || 'Karacter Media',
      })
    : undefined

export default buildConfig({
  email,
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    // The admin panel has its own <head>; without this its tab shows
    // Payload's icon instead of the Karacter monogram.
    meta: {
      icons: {
        icon: [
          { url: '/favicon.ico', sizes: '32x32' },
          { url: '/favicon.svg', type: 'image/svg+xml' },
        ],
        apple: [{ url: '/apple-touch-icon.png' }],
      },
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // Increment 1 close-out: schema is stable now, so we stop using
    // dev-mode push and switch to reviewed migrations (CLAUDE.md §3.5 —
    // never mix push with migrations against the same database).
    push: false,
    migrationDir: './src/migrations',
  }),
  collections: [
    Pages,
    Articles,
    Media,
    Categories,
    Tags,
    Users,
    PodcastShows,
    PodcastEpisodes,
    PodcastAudio,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer, SiteSettings],
  plugins,
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [publishScheduledArticles],
    // In-process runner only on an always-on server (Docker/VPS). On Vercel
    // functions are short-lived, so a cron in each instance never runs
    // reliably; there .github/workflows/scheduled-publish.yml calls
    // /api/payload-jobs/run with the CRON_SECRET bearer instead (ADR-0006).
    autoRun: process.env.VERCEL
      ? []
      : [
          {
            cron: '* * * * *',
            queue: 'scheduled-publish',
            limit: 10,
          },
        ],
  },
})
