import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function sanitizeFileName(fileName: string) {
  const baseName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return baseName || "asset";
}

function getConfig() {
  const accessKeyId = process.env.CLOUDFARE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFARE_SECRET_ACCESS_KEY;
  const bucketName = process.env.CLOUDFARE_BUCKET_NAME;
  const endpoint = process.env.CLOUDFARE_S3_API_URL;
  const publicUrlBase = process.env.CLOUDFARE_R2_DEVURL;

  if (!accessKeyId || !secretAccessKey || !bucketName || !endpoint) {
    return null;
  }

  return { accessKeyId, secretAccessKey, bucketName, endpoint, publicUrlBase };
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getConfig();
  if (!config) {
    return NextResponse.json({ error: "R2 is not configured" }, { status: 500 });
  }

  // S3Client constructed per-request — always has valid env values
  const s3Client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    const studioId = formData.get("studioId");

    if (!(file instanceof File) || typeof studioId !== "string" || !studioId) {
      return NextResponse.json(
        { error: "file and studioId are required" },
        { status: 400 },
      );
    }

    const safeName = sanitizeFileName(file.name);
    const key = `studios/${studioId}/uploads/${userId}/${Date.now()}-${randomUUID()}-${safeName}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type || "application/octet-stream",
      }),
    );

    if (!config.publicUrlBase) {
      return NextResponse.json(
        { error: "CLOUDFARE_R2_DEVURL is not configured" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      publicUrl: `${config.publicUrlBase.replace(/\/$/, "")}/${key}`,
      key,
    });
  }

  const body = (await request.json().catch(() => null)) as {
    fileName?: string;
    contentType?: string;
    studioId?: string;
  } | null;

  if (!body?.fileName || !body?.contentType || !body?.studioId) {
    return NextResponse.json(
      { error: "fileName, contentType, and studioId are required" },
      { status: 400 },
    );
  }

  const safeName = sanitizeFileName(body.fileName);
  const key = `studios/${body.studioId}/uploads/${userId}/${Date.now()}-${randomUUID()}-${safeName}`;

  const uploadUrl = await getSignedUrl(
    s3Client,
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      ContentType: body.contentType,
    }),
    { expiresIn: 300 },
  );

  if (!config.publicUrlBase) {
    return NextResponse.json(
      { error: "CLOUDFARE_R2_DEVURL is not configured" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    uploadUrl,
    publicUrl: `${config.publicUrlBase.replace(/\/$/, "")}/${key}`,
    key,
  });
}