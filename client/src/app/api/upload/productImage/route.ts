import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer(); // This is the actual file content
  const buffer = Buffer.from(arrayBuffer);

  const ext = file.name.split('.').pop();
  const randomHex = crypto.randomBytes(16).toString('hex');
  const key = `products/${randomHex}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer, // ✅ IMPORTANT: Actual content
    ContentType: file.type,
  });

  await r2.send(command);

  const imageUrl = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

  return NextResponse.json({ imageUrl });
}

