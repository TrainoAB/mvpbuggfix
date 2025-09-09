import s3Client from '@/app/api/aws/connect';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(req) {
  try {
    // Parse request body
    const { file, user = '', folder = '', filter = 'img' } = await req.json();

    // Define allowed file types
    const allowedFileTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (filter === 'doc') {
      allowedFileTypes.push('application/pdf');
      if (file.size > 1 * 1024 * 1024 && file.type === 'application/pdf') { // 1MB size limit for documents
        return NextResponse.json(
          { error: 'The maximum file size is 1MB for documents.' },
          { status: 400 }
        );
      }
    }

    // Validate file type
    if (!allowedFileTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Only ${allowedFileTypes.join(', ')} are allowed.` },
        { status: 400 }
      );
    }

    // Prepare the file for upload
    let buffer;
    let key;

    if (file.type.startsWith('image/')) {
      // Convert the image to WebP using sharp
      buffer = await sharp(Buffer.from(file.content, 'base64'))
        .webp({ quality: 80 }) // Adjust quality if needed
        .toBuffer();

      // Use a `.webp` extension for the S3 key
      key = `${user}/${folder ? folder + '/' : ''}${file.name.split('.').slice(0, -1).join('.')}.webp`;
    } else {
      // Handle non-image files (e.g., documents)
      buffer = Buffer.from(file.content, 'base64');
      key = `${user}/${folder ? folder + '/' : ''}${file.name}`;
    }

    // Define S3 upload parameters
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type.startsWith('image/') ? 'image/webp' : file.type,
      CacheControl: 'no-cache, no-store, must-revalidate',
    };

    // Upload the file to S3
    const data = await s3Client.send(new PutObjectCommand(params));

    // Respond with success
    return NextResponse.json({
      message: 'File uploaded and converted successfully',
      key,
      data,
    });
  } catch (error) {
    console.error('Error processing or uploading file:', error);
    return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
  }
}
