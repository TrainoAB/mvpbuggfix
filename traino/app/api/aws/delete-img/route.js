import s3Client from '@/app/api/aws/connect';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { saveNewUserInfo } from '@/app/functions/functions';

export async function POST(req) {
  const { user, type, src } = await req.json();

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${user}/${type}/${type}-image.webp`,
  };

  if (src) {
    params.Key = src.split('com/')[1];
  }

  try {
    const data = await s3Client.send(new DeleteObjectCommand(params));
    console.log('Image deleted:', data);

    if (type === 'profile') {
      await saveNewUserInfo({ id: user, thumbnail: 0 });
    } else if (type === 'cover') {
      await saveNewUserInfo({ id: user, coverimage: 0 });
    }

    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Error deleting image' }, { status: 500 });
  }
}
