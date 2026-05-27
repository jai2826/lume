import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function getConfig() {
  const accessKeyId = process.env.CLOUDFARE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFARE_SECRET_ACCESS_KEY;
  const bucketName = process.env.CLOUDFARE_BUCKET_NAME;
  const endpoint = process.env.CLOUDFARE_S3_API_URL;

  if (!accessKeyId || !secretAccessKey || !bucketName || !endpoint) {
    return null;
  }

  return { accessKeyId, secretAccessKey, bucketName, endpoint };
}

function getKeyFromPublicUrl(publicUrl: string) {
  try {
    const parsed = new URL(publicUrl);
    return parsed.pathname.replace(/^\/+/, "");
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getConfig();
  if (!config) {
    return NextResponse.json(
      { error: "R2 is not configured" },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    urls?: string[];
    studioId?: string;
  } | null;

  if (!body?.urls?.length) {
    return NextResponse.json(
      { error: "urls are required" },
      { status: 400 },
    );
  }

  const s3Client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const studioPrefix = body.studioId
    ? `studios/${body.studioId}/`
    : null;

  const keys = body.urls
    .map(getKeyFromPublicUrl)
    .filter((key): key is string => Boolean(key))
    .filter((key) => !studioPrefix || key.startsWith(studioPrefix));

  const deleted: string[] = [];
  const failed: string[] = [];

  for (const key of keys) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: config.bucketName,
          Key: key,
        }),
      );
      deleted.push(key);
    } catch {
      failed.push(key);
    }
  }

  if (failed.length) {
    return NextResponse.json(
      {
        deleted,
        failed,
        error: "Some media files could not be deleted.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ deleted, failed });
}