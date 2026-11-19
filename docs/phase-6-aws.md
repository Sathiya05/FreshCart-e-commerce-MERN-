# Phase 6 — AWS fundamentals (S3 image uploads)

Phase 6 replaces the “paste an image URL only” workflow in admin product management
with real browser-to-S3 uploads using short-lived presigned URLs.

No AWS credentials are required for the app to run. When S3 is not configured,
uploads are disabled gracefully and the existing public-URL field keeps working.

## What changed

### Server
- `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` added.
- `config/env.js` reads AWS/S3 settings and exposes `s3Configured`.
- `services/upload.service.js` validates image type/size and creates a 5-minute
  presigned `PUT` URL plus the future public URL.
- `GET /api/admin/uploads/config` reports whether uploads are available.
- `POST /api/admin/uploads/presign` creates an upload ticket (admin only).

### Client
- `services/admin.service.js` uploads the file directly to S3 from the browser.
- Admin Products has **Upload image** actions in the toolbar and product form.
- A successful upload fills the product form’s image URL automatically and shows
  a preview.

## Environment variables

Add these to `server/.env` (see `server/.env.example`):

```text
AWS_REGION=ap-south-1
S3_BUCKET=your-freshcart-bucket
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
# Optional: CDN / CloudFront domain. Without it the S3 website URL is used.
# S3_PUBLIC_BASE_URL=https://cdn.your-domain.com
```

On an AWS host with an attached IAM role, leave the keys empty and set:

```text
AWS_USE_IAM_ROLE=true
```

Never commit real keys. `server/.env` is git-ignored.

## S3 bucket setup

1. Create a private bucket in your chosen region, e.g. `freshcart-images`.
2. Block all public access if you will serve images through CloudFront.
3. Add this bucket CORS policy (**CORS configuration**, not bucket policy):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://freshcart-e-commerce-mern.pages.dev"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Add your custom storefront domain to `AllowedOrigins` when you use one.

4. If you are **not** using CloudFront, either enable public read access for the
   bucket or attach a bucket policy allowing `s3:GetObject` to everyone for
   `products/*`. Then leave `S3_PUBLIC_BASE_URL` unset and the API will return
   `https://<bucket>.s3.<region>.amazonaws.com/<key>`.

5. The IAM user/role needs only:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::your-freshcart-bucket/products/*"
    }
  ]
}
```

## API contract

`GET /api/admin/uploads/config`

```json
{
  "success": true,
  "data": {
    "enabled": true,
    "provider": "s3",
    "maxUploadBytes": 5242880,
    "allowedTypes": ["image/jpeg", "image/png", "image/webp", "image/avif"]
  }
}
```

`POST /api/admin/uploads/presign`

```json
{ "fileName": "tomatoes.jpg", "contentType": "image/jpeg", "size": 245760 }
```

Response:

```json
{
  "success": true,
  "data": {
    "method": "PUT",
    "uploadUrl": "https://…",
    "publicUrl": "https://…/products/…",
    "key": "products/…",
    "contentType": "image/jpeg",
    "expiresIn": 300
  }
}
```

The browser then sends the file directly to `uploadUrl` with `Content-Type`
matching the ticket. The API never proxies the image bytes.

## Verify

1. Set the variables and restart the API.
2. `GET /api/admin/uploads/config` should return `"enabled": true`.
3. Sign in as admin → Products → **Upload image**.
4. Choose a JPG/PNG/WebP/AVIF under 5 MB.
5. The image URL and preview should appear in the product form; save the product.
6. Open the storefront and confirm the product image loads.

## Security notes

- Only admins can request tickets; tickets expire in 5 minutes.
- Keys are generated server-side with a random UUID — client file names cannot
  overwrite arbitrary objects.
- Object size and MIME type are validated both in the validator and the service.
- Images are cached as immutable because each upload gets a unique key.

## Status

Phase 6 code is complete. **Phase 7 (deployment/infrastructure) is still pending**
and requires your AWS/render account decisions and credentials.
