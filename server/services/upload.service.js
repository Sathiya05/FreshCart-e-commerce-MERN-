import { randomUUID } from 'node:crypto'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../config/env.js'
import { ApiError } from '../utils/apiError.js'

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

let s3Client = null

const getClient = () => {
  if (!env.s3Configured) {
    throw new ApiError(
      503,
      'Image uploads are not configured on this server. Paste an image URL instead.',
      'UPLOADS_NOT_CONFIGURED',
    )
  }

  if (!s3Client) {
    const credentials =
      env.s3UseIamRole || !env.awsAccessKeyId
        ? undefined
        : {
            accessKeyId: env.awsAccessKeyId,
            secretAccessKey: env.awsSecretAccessKey,
          }

    s3Client = new S3Client({
      region: env.awsRegion,
      credentials,
    })
  }

  return s3Client
}

export const getUploadConfig = () => ({
  enabled: env.s3Configured,
  provider: 's3',
  maxUploadBytes: MAX_UPLOAD_BYTES,
  allowedTypes: Object.keys(ALLOWED_TYPES),
})

export const createImageUploadTicket = async ({
  fileName,
  contentType,
  size,
} = {}) => {
  const client = getClient()
  const extension = ALLOWED_TYPES[contentType]
  const bytes = Number(size)

  if (!extension) {
    throw new ApiError(
      400,
      'Use a JPG, PNG, WebP or AVIF image.',
      'INVALID_IMAGE_TYPE',
    )
  }
  if (!Number.isFinite(bytes) || bytes <= 0 || bytes > MAX_UPLOAD_BYTES) {
    throw new ApiError(
      400,
      'Images must be between 1 byte and 5 MB.',
      'INVALID_IMAGE_SIZE',
    )
  }

  const safeName = String(fileName || 'image')
    .toLowerCase()
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'image'
  const key = `products/${Date.now()}-${randomUUID()}-${safeName}.${extension}`
  const command = new PutObjectCommand({
    Bucket: env.s3Bucket,
    Key: key,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  })

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 })
  const publicUrl = env.s3PublicBaseUrl
    ? `${env.s3PublicBaseUrl}/${key}`
    : `https://${env.s3Bucket}.s3.${env.awsRegion}.amazonaws.com/${key}`

  return {
    method: 'PUT',
    uploadUrl,
    publicUrl,
    key,
    contentType,
    expiresIn: 300,
  }
}
