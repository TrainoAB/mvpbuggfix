import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client from '@/app/api/aws/connect';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const bucketName = searchParams.get('bucketName');
  const objectKey = searchParams.get('objectKey');

  if (!bucketName || !objectKey) {
    return NextResponse.json({ error: 'Missing bucketName or objectKey' }, { status: 400 });
  }

  try {
    const command = new GetObjectCommand({ Bucket: bucketName, Key: objectKey });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 60 }); // 60 seconds expiration
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return NextResponse.json({ error: 'Error generating pre-signed URL' }, { status: 500 });
  }
};
