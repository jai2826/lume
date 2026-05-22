import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const accessKeyId = process.env.CLOUDFARE_ACCESS_KEY_ID;
const secretAccessKey =
  process.env.CLOUDFARE_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFARE_BUCKET_NAME;
const publicUrlBase =
  process.env.CLOUDFARE_R2_DEVURL;
const endpoint = process.env.CLOUDFARE_S3_API_URL;

function sanitizeFileName(fileName: string) {
  const baseName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-") //Replace invalid characters with hyphens
    .replace(/-+/g, "-")            //Collapse multiple hyphens into one
    .replace(/^[-.]+|[-.]+$/g, ""); //Remove leading/trailing hyphens and dots

  return baseName || "asset";
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: endpoint,
  credentials:
    accessKeyId && secretAccessKey
      ? { accessKeyId, secretAccessKey }
      : undefined,
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  if (
    !accessKeyId ||
    !secretAccessKey ||
    !bucketName ||
    !endpoint
  ) {
    return NextResponse.json(
      { error: "R2 is not configured" },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    fileName?: string;
    contentType?: string;
    studioId?: string;
  } | null;

  if (
    !body?.fileName ||
    !body?.contentType ||
    !body?.studioId
  ) {
    return NextResponse.json(
      {
        error:
          "fileName, contentType, and studioId are required",
      },
      { status: 400 },
    );
  }

  const safeName = sanitizeFileName(body.fileName);
  const key = `studios/${body.studioId}/uploads/${userId}/${Date.now()}-${randomUUID()}-${safeName}`;

  const putCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: body.contentType,
  });

  const uploadUrl = await getSignedUrl(
    s3Client,
    putCommand,
    { expiresIn: 300 },
  );

  return NextResponse.json({
    uploadUrl,
    publicUrl: `${publicUrlBase?.replace(/\/$/, "") || endpoint.replace(/\/$/, "")}/${key}`,
    key,
  });
}
