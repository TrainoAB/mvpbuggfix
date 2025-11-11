# AWS S3 File Storage

This document describes Traino's AWS S3 integration for file storage, including upload/download flow, image processing with Sharp (WebP conversion), and bucket management.

---

## Overview

Traino uses **AWS S3** (Simple Storage Service) for storing:

- **Profile images** (trainers, trainees)
- **Cover images** (trainer profiles)
- **Certificates** (trainer credentials, licenses)
- **Product images** (training programs, diet plans)
- **Documents** (PDFs, contracts)

**Key Features**:

- Automatic WebP conversion for images (Sharp library)
- Presigned URLs for secure downloads
- Folder-based organization (`{user_id}/{folder}/`)
- Cache-control headers (no-cache for dynamic content)

---

## S3 Configuration

### Bucket Details

| Property | Value |
|----------|-------|
| **Bucket Name** | `traino` |
| **Region** | `eu-north-1` (Stockholm) |
| **Access** | Private (IAM-based) |
| **Versioning** | Disabled |
| **Encryption** | AES-256 (server-side) |

### Environment Variables

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=eu-north-1
AWS_BUCKET_NAME=traino
```

---

## Upload Flow

### Endpoint

`/app/api/aws/upload-img/route.js`

### Request

```javascript
const response = await fetch('/api/aws/upload-img', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    file: {
      name: 'profile.jpg',
      type: 'image/jpeg',
      content: base64EncodedImage, // Base64 string
      size: 123456
    },
    user: '123',
    folder: 'profile',
    filter: 'img' // or 'doc' for PDFs
  })
});

const { key, message } = await response.json();
// key: "123/profile/profile.webp"
```

### Server Logic

```javascript
// 1. Validate file type
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
if (!allowedTypes.includes(file.type)) {
  return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
}

// 2. Convert image to WebP
const buffer = await sharp(Buffer.from(file.content, 'base64'))
  .webp({ quality: 80 })
  .toBuffer();

// 3. Generate S3 key
const key = `${user}/${folder}/${file.name.split('.')[0]}.webp`;

// 4. Upload to S3
const params = {
  Bucket: process.env.AWS_BUCKET_NAME,
  Key: key,
  Body: buffer,
  ContentType: 'image/webp',
  CacheControl: 'no-cache, no-store, must-revalidate'
};

await s3Client.send(new PutObjectCommand(params));
```

---

## Download Flow

### Endpoint

`/app/api/aws/generate-url`

### Request

```javascript
const response = await fetch(
  `/api/aws/generate-url?bucketName=traino&objectKey=123/profile/profile.webp`
);
const { url } = await response.json();

// Use presigned URL (valid for 1 hour)
<img src={url} alt="Profile" />
```

### Presigned URL Generation

```javascript
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const command = new GetObjectCommand({
  Bucket: bucketName,
  Key: objectKey
});

const url = await getSignedUrl(s3Client, command, { expiresIn: 60 }); // 60 seconds
return { url };
```

**Expiration**: 60 seconds (configurable via `expiresIn` parameter)

---

## Image Processing (Sharp)

### WebP Conversion

**Benefits**:

- **File size**: 25-35% smaller than JPEG
- **Quality**: Minimal visual loss at 80% quality
- **Browser support**: 97%+ (all modern browsers)

**Configuration**:

```javascript
sharp(inputBuffer)
  .webp({
    quality: 80, // 1-100 (default 80)
    lossless: false,
    nearLossless: false
  })
  .toBuffer();
```

### Resizing (Optional)

```javascript
// Resize to max 1920x1080, maintain aspect ratio
sharp(inputBuffer)
  .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 80 })
  .toBuffer();
```

---

## Folder Structure

```
traino/
├── {user_id}/
│   ├── profile/
│   │   ├── profile.webp
│   │   └── thumbnail.webp
│   ├── cover/
│   │   └── cover.webp
│   ├── certificates/
│   │   ├── pt_cert.webp
│   │   └── license.pdf
│   └── products/
│       ├── product_123/
│       │   ├── image1.webp
│       │   └── image2.webp
│       └── product_456/
│           └── image1.webp
```

---

## Database Integration

### Storing File References

```sql
-- User profile image
UPDATE users SET thumbnail = 1 WHERE id = 123;

-- Certificate uploads
INSERT INTO user_files (user_id, file_names, uploaded_at)
VALUES (123, '["certificates/pt_cert.webp", "certificates/license.pdf"]', NOW());
```

### Fetching Files

```php
$stmt = $pdo->prepare("SELECT file_names FROM user_files WHERE user_id = :user_id");
$stmt->execute([':user_id' => $user_id]);
$files = json_decode($stmt->fetchColumn(), true);

// Generate presigned URLs for each file
foreach ($files as $file) {
    $url = generatePresignedUrl('traino', $user_id . '/' . $file);
    // ...
}
```

---

### Security Best Practices

1. **Private Bucket**: No public read access
2. **IAM Policies**: Restrict S3 actions to specific users/roles
3. **Presigned URLs**: Time-limited access (60 seconds default, configurable)
4. **File Type Validation**: Server-side MIME type checks
5. **Size Limits**: 1MB for docs, 5MB for images
6. **Virus Scanning**: TODO (integrate ClamAV or AWS Macie)

---

## Cost Optimization

### Current Usage (Estimated)

| Metric | Value |
|--------|-------|
| Average file size | 200 KB (WebP) |
| Files per user | 5-10 |
| Total users | 10,000 |
| Storage needed | ~20 GB |
| Monthly cost | ~$0.50 (S3 Standard) |

### Recommendations

- Use **S3 Intelligent-Tiering** for rarely accessed files (e.g., old certificates)
- Enable **S3 Lifecycle Policies** to archive files >1 year to Glacier
- Implement **CloudFront CDN** for frequently accessed images (profile pics)

---

## Related Documentation

- [Architecture Overview](ARCHITECTURE.md)
- [Database Schema](DATABASE.md)

---

**Last Updated**: 2025-11-11
