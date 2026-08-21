import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

let r2: S3Client | null = null;
if (process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
  r2 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = (file.name || 'captured_image.png').split('.').pop() || 'png';
    const randomHex = crypto.randomBytes(16).toString('hex');
    const filename = `${randomHex}.${ext}`;
    const key = `products/${filename}`;

    // 1. Save to local public/uploads/products/ so browser can always render /uploads/products/filename
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);
    const localUrl = `/uploads/products/${filename}`;

    // 2. Also sync to Cloudflare R2 if configured
    if (r2 && process.env.R2_BUCKET_NAME) {
      try {
        const command = new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: file.type || 'image/png',
        });
        await r2.send(command);
      } catch (r2Err) {
        console.warn('R2 Upload skipped/failed, using local URL:', r2Err);
      }
    }

    return NextResponse.json({ imageUrl: localUrl });

  } catch (error: any) {
    console.error('Image upload failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to process image upload' }, { status: 500 });
  }
}
