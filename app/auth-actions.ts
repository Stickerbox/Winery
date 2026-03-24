"use server";

import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function login(formData: FormData) {
    const username = formData.get("username") as string;

    if (!username || username.trim().length === 0) {
        throw new Error("Username is required");
    }

    // Find or create user
    let user = await prisma.user.findUnique({
        where: { username },
    });

    if (!user) {
        user = await prisma.user.create({
            data: { username },
        });
    }

    // Set cookie
    (await cookies()).set("userId", user.id.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
    });

    redirect("/");
}

export async function logout() {
    (await cookies()).delete("userId");
    redirect("/login");
}

export async function getCurrentUser() {
    const userId = (await cookies()).get("userId")?.value;

    if (!userId) return null;

    const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
    });

    return user;
}
