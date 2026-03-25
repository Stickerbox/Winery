"use client";

import * as React from "react";
import { Wine, User } from "@prisma/client";
import { WineGrid } from "@/components/WineGrid";
import { WineModal } from "@/components/WineModal";
import { FollowButton } from "@/components/FollowButton";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "@/components/LanguageContext";
import Link from "next/link";

type ProfileUser = User & { wines: Wine[] };

interface ProfileViewProps {
    profile: ProfileUser;
    currentUserId: number | null;
    initialIsFollowing: boolean;
}

export function ProfileView({ profile, currentUserId, initialIsFollowing }: ProfileViewProps) {
    const [selectedWine, setSelectedWine] = React.useState<Wine | null>(null);
    const { t } = useTranslations();

    const showFollowButton = currentUserId !== null && currentUserId !== profile.id;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div>
                        <Link href="/" className="text-sm text-violet-600 hover:underline mb-1 block">
                            VinoVault
                        </Link>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                            {profile.username}
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {t.profile.wineCount.replace("{count}", String(profile.wines.length))}
                        </p>
                    </div>
                    {showFollowButton && (
                        <FollowButton
                            userId={profile.id}
                            initialIsFollowing={initialIsFollowing}
                        />
                    )}
                </div>
            </header>

            <main className="container mx-auto max-w-7xl">
                <WineGrid
                    wines={profile.wines}
                    onWineClick={(wine) => setSelectedWine(wine)}
                    readonly
                />
            </main>

            <AnimatePresence>
                {selectedWine && (
                    <WineModal
                        wine={selectedWine}
                        onClose={() => setSelectedWine(null)}
                        readonly
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
