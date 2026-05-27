import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import {
  createPartFromUri,
  GoogleGenAI,
} from "@google/genai";
import { generateText, Output } from "ai";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { PLATFORMS } from "@/lib/constants";
import type { PlatformKey } from "@/lib/types";

export const runtime = "nodejs";

const platformKeySchema = z.enum(
  PLATFORMS.map((platform) => platform.key) as [
    PlatformKey,
    ...PlatformKey[],
  ],
);

const promptResponseSchema = z.object({
  prompts: z.array(
    z.object({
      platform: platformKeySchema,
      prompt: z.string(),
    }),
  ),
});

type ComposerGenerateRequest = {
  studioId?: string;
  title?: string;
  text?: string;
  attachments?: Array<{
    url: string;
    mimeType: string;
  }>;
  platforms?: Array<{
    key: PlatformKey;
    selected?: boolean;
    postType?: string;
    notes?: string;
  }>;
};

type ComposerGenerateResponse = {
  prompts: Partial<
    Record<
      PlatformKey,
      {
        aiPrompt: string;
        generatedImageUrl?: string;
      }
    >
  >;
};

function getR2Config() {
  const accessKeyId = process.env.CLOUDFARE_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.CLOUDFARE_SECRET_ACCESS_KEY;
  const bucketName = process.env.CLOUDFARE_BUCKET_NAME;
  const endpoint = process.env.CLOUDFARE_S3_API_URL;
  const publicUrlBase = process.env.CLOUDFARE_R2_DEVURL;

  if (
    !accessKeyId ||
    !secretAccessKey ||
    !bucketName ||
    !endpoint
  ) {
    return null;
  }

  return {
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint,
    publicUrlBase,
  };
}

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY;
}

function buildAspectRatio(
  platform: PlatformKey,
  postType?: string,
) {
  const normalizedPostType = postType?.toLowerCase() ?? "";

  if (platform === "youtube") return "16:9";
  if (platform === "tiktok" || platform === "snapchat")
    return "9:16";
  if (platform === "x") return "1:1";

  if (
    normalizedPostType.includes("story") ||
    normalizedPostType.includes("reel") ||
    normalizedPostType.includes("short")
  ) {
    return "9:16";
  }

  return "4:5";
}

function buildPromptRequest({
  title,
  text,
  platforms,
  attachments,
}: {
  title: string;
  text: string;
  platforms: Array<{
    key: PlatformKey;
    postType?: string;
    notes?: string;
  }>;
  attachments: Array<{ url: string; mimeType: string }>;
}) {
  const attachmentSummary = attachments.length
    ? attachments
        .map((attachment) => attachment.mimeType)
        .join(", ")
    : "no image references attached";

  return [
    "Generate one concise image prompt for each requested platform.",
    "Return only JSON matching the schema.",
    title ? `Title: ${title}` : "",
    text
      ? `Main prompt: ${text}`
      : "Main prompt: derive from the title and media references.",
    `Reference image MIME types: ${attachmentSummary}.`,
    "Each prompt should be optimized for social creative generation, be specific, and avoid commentary or markdown.",
    "Use the platform notes and post type as creative constraints.",
    `Platforms: ${JSON.stringify(platforms, null, 2)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function uploadGeneratedImage({
  studioId,
  userId,
  platform,
  mimeType,
  base64,
}: {
  studioId: string;
  userId: string;
  platform: PlatformKey;
  mimeType: string;
  base64: string;
}) {
  const config = getR2Config();
  if (!config?.publicUrlBase) {
    throw new Error("R2 is not configured");
  }

  const s3Client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const key = `studios/${studioId}/composer-generated/${userId}/${platform}/${Date.now()}-${randomUUID()}.png`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: Buffer.from(base64, "base64"),
      ContentType: mimeType,
    }),
  );

  return `${config.publicUrlBase.replace(/\/$/, "")}/${key}`;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const geminiApiKey = getGeminiApiKey();
  if (!geminiApiKey) {
    return NextResponse.json(
      { error: "Gemini API key is not configured" },
      { status: 500 },
    );
  }

  const body = (await request
    .json()
    .catch(() => null)) as ComposerGenerateRequest | null;
  if (!body?.studioId || !body.platforms?.length) {
    return NextResponse.json(
      { error: "studioId and platforms are required" },
      { status: 400 },
    );
  }

  const selectedPlatforms = body.platforms.filter(
    (platform) => platform.selected,
  );

  if (!selectedPlatforms.length) {
    return NextResponse.json(
      { error: "Select at least one platform" },
      { status: 400 },
    );
  }

  const promptGenerator = createGoogleGenerativeAI({
    apiKey: geminiApiKey,
  });

  const { output } = await generateText({
    model: promptGenerator("gemini-2.5-flash"),
    output: Output.object({ schema: promptResponseSchema }),
    prompt: buildPromptRequest({
      title: body.title?.trim() ?? "",
      text: body.text?.trim() ?? "",
      platforms: selectedPlatforms.map((platform) => ({
        key: platform.key,
        postType: platform.postType?.trim() || undefined,
        notes: platform.notes?.trim() || undefined,
      })),
      attachments: body.attachments ?? [],
    }),
  });

  const promptMap = new Map<PlatformKey, string>(
    output.prompts.map((entry) => [
      entry.platform,
      entry.prompt,
    ]),
  );

  const imageClient = new GoogleGenAI({
    apiKey: geminiApiKey,
  });

  const referenceParts = (body.attachments ?? [])
    .filter((attachment) => attachment.url.trim())
    .map((attachment) =>
      createPartFromUri(
        attachment.url,
        attachment.mimeType,
      ),
    );

  const generatedPrompts = await Promise.all(
    selectedPlatforms.map(async (platform) => {
      const aiPrompt = promptMap.get(platform.key);
      if (!aiPrompt) {
        return [platform.key, { aiPrompt: "" }] as const;
      }

      try {
        const response =
          await imageClient.models.generateContent({
            model: "gemini-3.1-flash-image-preview",
            contents: [
              {
                role: "user",
                parts: [
                  { text: aiPrompt },
                  ...referenceParts,
                ],
              },
            ],
            config: {
              responseModalities: ["IMAGE"],
              imageConfig: {
                aspectRatio: buildAspectRatio(
                  platform.key,
                  platform.postType,
                ),
                imageSize: "1K",
              },
            },
          });

        const imagePart =
          response.candidates?.[0]?.content?.parts?.find(
            (part) => Boolean(part.inlineData?.data),
          );

        const inlineData = imagePart?.inlineData;
        if (!inlineData?.data || !inlineData.mimeType) {
          return [platform.key, { aiPrompt }] as const;
        }

        const generatedImageUrl =
          await uploadGeneratedImage({
            studioId: body.studioId!,
            userId,
            platform: platform.key,
            mimeType: inlineData.mimeType,
            base64: inlineData.data,
          });

        return [
          platform.key,
          { aiPrompt, generatedImageUrl },
        ] as const;
      } catch {
        return [platform.key, { aiPrompt }] as const;
      }
    }),
  );

  const responseBody: ComposerGenerateResponse = {
    prompts: Object.fromEntries(generatedPrompts),
  };

  return NextResponse.json(responseBody);
}
