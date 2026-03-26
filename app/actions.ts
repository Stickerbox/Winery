"use server";

import { PrismaClient, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import Anthropic from "@anthropic-ai/sdk";
import { detectServerLang } from "@/lib/i18n";

const prisma = new PrismaClient();

import { getCurrentUser } from "./auth-actions";

async function uploadWineImage(image: File): Promise<string> {
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

    await fs.writeFile(path.join(uploadDir, filename), compressed);
    return `/uploads/${filename}`;
}

export async function analyzeWineImage(formData: FormData): Promise<{ name: string; description: string }> {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const lang = detectServerLang((await headers()).get("accept-language"));
    const langInstruction = lang === "fr" ? "Réponds en français." : "Respond in English.";

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
                    text: `Analyze this photo. If it is not a wine, beer, cider, or champagne bottle or label, or if you cannot identify the drink, return exactly:
{"name": "", "description": ""}

If you can identify the drink (wine, beer, cider, or champagne), return ONLY a JSON object with exactly these two fields:
{
  "name": "producer/brewery/winery, drink name, and vintage year or batch if visible",
  "description": "one sentence tasting note covering the key flavours and a food pairing"
}
No other text before or after the JSON. ${langInstruction}`,
                },
            ],
        }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found in Claude response");
    return JSON.parse(match[0]) as { name: string; description: string };
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

    const imagePath = await uploadWineImage(image);

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

export async function addToWishlistManual(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const image = formData.get("image") as File;

    if (!name || !description || !image) {
        throw new Error("Missing required fields");
    }

    const imagePath = await uploadWineImage(image);

    try {
        await prisma.wishlistItem.create({
            data: {
                userId: user.id,
                name,
                description,
                imagePath,
                addedByUsername: user.username,
            },
        });
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            // Already on wishlist — no-op
            return;
        }
        throw e;
    }

    revalidatePath("/");
}

export async function generateShareToken(wineId: number): Promise<string> {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const wine = await prisma.wine.findUnique({ where: { id: wineId } });
    if (!wine || wine.userId !== user.id) throw new Error("Not found");

    if (wine.shareToken) return wine.shareToken;

    const token = randomUUID();
    await prisma.wine.update({ where: { id: wineId }, data: { shareToken: token } });
    return token;
}

export async function addSharedWine(token: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const wine = await prisma.wine.findUnique({
        where: { shareToken: token },
        include: { user: true },
    });
    if (!wine) throw new Error("Wine not found");
    if (!wine.user) throw new Error("Sharer not found");

    if (wine.userId === user.id) throw new Error("Already in your collection");

    await prisma.wine.create({
        data: {
            name: wine.name,
            description: wine.description,
            rating: wine.rating,
            imagePath: wine.imagePath,
            userId: user.id,
            sharedByUsername: wine.user.username,
        },
    });

    revalidatePath("/");
    redirect("/");
}

export async function deleteWine(id: number) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const wine = await prisma.wine.findUnique({ where: { id } });
    if (!wine || wine.userId !== user.id) throw new Error("Not found");

    // Only delete the image file if no other wine references it
    const otherRefs = await prisma.wine.count({
        where: { imagePath: wine.imagePath, id: { not: id } },
    });
    if (otherRefs === 0) {
        const filePath = path.join(process.cwd(), "public", wine.imagePath);
        await fs.unlink(filePath).catch(() => {});
    }

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

export async function getUserProfile(username: string) {
    return await prisma.user.findUnique({
        where: { username },
        include: { wines: { orderBy: { createdAt: "desc" } } },
    });
}

export async function getIsFollowing(userId: number): Promise<boolean> {
    const currentUser = await getCurrentUser();
    if (!currentUser) return false;
    const follow = await prisma.follow.findUnique({
        where: {
            followerId_followingId: {
                followerId: currentUser.id,
                followingId: userId,
            },
        },
    });
    return follow !== null;
}

export async function followUser(userId: number) {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");
    if (currentUser.id === userId) throw new Error("Cannot follow yourself");
    try {
        await prisma.follow.create({
            data: { followerId: currentUser.id, followingId: userId },
        });
    } catch {
        // Duplicate follow — unique constraint violation, treat as no-op
    }
    revalidatePath("/");
}

export async function unfollowUser(userId: number) {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");
    await prisma.follow.deleteMany({
        where: { followerId: currentUser.id, followingId: userId },
    });
    revalidatePath("/");
}

export async function addToWishlist(wineId: number) {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");

    const wine = await prisma.wine.findUnique({ where: { id: wineId } });
    if (!wine) throw new Error("Wine not found");

    const owner = await prisma.user.findUnique({ where: { id: wine.userId }, select: { username: true } });
    if (!owner) throw new Error("Wine owner not found");

    try {
        await prisma.wishlistItem.create({
            data: {
                userId: currentUser.id,
                name: wine.name,
                description: wine.description,
                imagePath: wine.imagePath,
                addedByUsername: owner.username,
            },
        });
    } catch (e) {
        if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) {
            throw e;
        }
        // Unique constraint — already wishlisted, treat as no-op
    }
    revalidatePath("/");
}

export async function removeFromWishlist(itemId: number) {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");

    // deleteMany used for owner check — does NOT delete image files;
    // imagePath is a snapshot of the original owner's file.
    await prisma.wishlistItem.deleteMany({
        where: { id: itemId, userId: currentUser.id },
    });
    revalidatePath("/");
}

export async function getWishlist() {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];

    return await prisma.wishlistItem.findMany({
        where: { userId: currentUser.id },
        orderBy: { createdAt: "desc" },
    });
}

export async function moveToCollection(itemId: number, formData: FormData) {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");

    const item = await prisma.wishlistItem.findUnique({ where: { id: itemId } });
    if (!item || item.userId !== currentUser.id) throw new Error("Not found");

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const rating = parseInt(formData.get("rating") as string);
    const image = formData.get("image") as File;

    if (!name || !description || !rating || !image) {
        throw new Error("Missing required fields");
    }

    let imagePath: string | null = null;

    try {
        imagePath = await uploadWineImage(image);

        await prisma.$transaction([
            prisma.wine.create({
                data: { name, description, rating, imagePath, userId: currentUser.id },
            }),
            prisma.wishlistItem.delete({ where: { id: itemId } }),
        ]);
    } catch (e) {
        if (imagePath) {
            await fs.unlink(path.join(process.cwd(), "public", imagePath)).catch(() => {});
        }
        throw e;
    }

    revalidatePath("/");
}

export async function getFollowingFeed() {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];
    const follows = await prisma.follow.findMany({
        where: { followerId: currentUser.id },
        select: { followingId: true },
    });
    const followingIds = follows.map((f) => f.followingId);
    if (followingIds.length === 0) return [];
    return await prisma.wine.findMany({
        where: { userId: { in: followingIds } },
        include: { user: { select: { username: true } } },
        orderBy: { createdAt: "desc" },
    });
}
