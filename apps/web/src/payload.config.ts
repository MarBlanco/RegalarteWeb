import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { resendAdapter } from '@payloadcms/email-resend'
import path from 'path'
import { fileURLToPath } from 'url'
import { Users } from '@/collections/Users'
import { Media } from '@/collections/Media'
import { Categories } from '@/collections/Categories'
import { ProductTags } from '@/collections/ProductTags'
import { Products } from '@/collections/Products'
import { ProductAttributes } from '@/collections/ProductAttributes'
import { ProductImages } from '@/collections/ProductImages'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: 'users',
  },
  collections: [Users, Media, Categories, ProductTags, Products, ProductAttributes, ProductImages],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  email:
    process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith('placeholder')
      ? resendAdapter({
          defaultFromAddress: process.env.RESEND_FROM_EMAIL || 'noreply@regalarte.com',
          defaultFromName: process.env.RESEND_FROM_NAME || 'REGALARTE',
          apiKey: process.env.RESEND_API_KEY,
        })
      : undefined,
  plugins: [
    ...(process.env.R2_ACCESS_KEY_ID && !process.env.R2_ACCESS_KEY_ID.startsWith('placeholder')
      ? [
          s3Storage({
            collections: {
              media: {
                prefix: 'media',
              },
            },
            bucket: process.env.R2_BUCKET || '',
            config: {
              region: 'auto',
              endpoint: process.env.R2_ENDPOINT || '',
              forcePathStyle: true,
              credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
              },
            },
          }),
        ]
      : []),
  ],
})
