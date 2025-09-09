import s3Client from '@/app/api/aws/connect';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  let folder = searchParams.get('folder');
  let subFolder = searchParams.get('subfolder') || '';

  if (!folder) {
    console.error('Error fetching images: Folder is required');
    return NextResponse.json({ error: 'Folder is required' }, { status: 400 });
  }

  // Ensure folder ends with a slash
  if (!folder.endsWith('/')) {
    folder += '/';
  }

  // Ensure subFolder ends with a slash if it's not empty
  if (subFolder && !subFolder.endsWith('/')) {
    subFolder += '/';
  }

  const prefix = `${folder}${subFolder}`;

  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Prefix: prefix,
  };

  try {
    const data = await s3Client.send(new ListObjectsV2Command(s3Params));

    // Check if folder exists
    if (!data.Contents || data.Contents.length === 0) {
      return NextResponse.json({ error: 'Folder or subfolder does not exist' }, { status: 404 });
    }
    
    const imageUrls = data.Contents.map(item => `https://${s3Params.Bucket}.s3.amazonaws.com/${item.Key}`);
    return NextResponse.json({ imageUrls });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ error: 'Error fetching images' }, { status: 500 });
  }
}
