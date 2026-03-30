"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

export async function getPasskeys() {
    const user = await getCurrentUser();
    if (!user) return [];

    return prisma.credential.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
    });
}

export async function removePasskey(id: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const count = await prisma.credential.count({ where: { userId: user.id } });
    if (count <= 1) throw new Error("Cannot remove your only passkey");

    await prisma.credential.delete({
        where: { id, userId: user.id },
    });
}
