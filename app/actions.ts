"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import Anthropic from "@anthropic-ai/sdk";

const prisma = new PrismaClient();

import { getCurrentUser } from "./auth-actions";

export async function analyzeWineImage(formData: FormData): Promise<{ name: string; description: string }> {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const image = formData.get("image") as File;
    if (!image) throw new Error("No image provided");

    const buffer = Buffer.from(await image.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mediaType = (image.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    const client = new Anthropic();
    const response = await client.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 1024,
        messages: [{
            role: "user",
            content: [
                {
                    type: "image",
                    source: { type: "base64", media_type: mediaType, data: base64 },
                },
                {
                    type: "text",
                    text: `Analyze this wine bottle or label photo. Return ONLY a JSON object with exactly these two fields:
{
  "name": "the wine name including producer/winery and vintage year if visible",
  "description": "2-3 sentences about this wine's typical taste, characteristics, and food pairings"
}
No other text before or after the JSON.`,
                },
            ],
        }],
    });

    let text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    return JSON.parse(text) as { name: string; description: string };
}

export async function addWine(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const rating = parseInt(formData.get("rating") as string);
    const image = formData.get("image") as File;

    if (!name || !description || !rating || !image) {
        throw new Error("Missing required fields");
    }

    // Handle image upload
    const buffer = Buffer.from(await image.arrayBuffer());
    const filename = `${randomUUID()}.jpg`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    try {
        await fs.access(uploadDir);
    } catch {
        await fs.mkdir(uploadDir, { recursive: true });
    }

    const compressed = await sharp(buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, compressed);

    const imagePath = `/uploads/${filename}`;

    // Save to database
    await prisma.wine.create({
        data: {
            name,
            description,
            rating,
            imagePath,
            userId: user.id,
        },
    });

    revalidatePath("/");
}

export async function deleteWine(id: number) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const wine = await prisma.wine.findUnique({ where: { id } });
    if (!wine || wine.userId !== user.id) throw new Error("Not found");

    // Delete image file
    const filePath = path.join(process.cwd(), "public", wine.imagePath);
    await fs.unlink(filePath).catch(() => {});

    await prisma.wine.delete({ where: { id } });
    revalidatePath("/");
}

export async function getWines() {
    const user = await getCurrentUser();
    if (!user) return [];

    return await prisma.wine.findMany({
        where: {
            userId: user.id,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}
