"use client";

import * as React from "react";
import { Wine } from "@prisma/client";
import { WineCard } from "@/components/WineCard";
import { WineModal } from "@/components/WineModal";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "@/components/LanguageContext";
import Link from "next/link";

type FeedWine = Wine & { user: { username: string } };

interface FollowingFeedProps {
    wines: FeedWine[];
}

export function FollowingFeed({ wines }: FollowingFeedProps) {
    const [selectedWine, setSelectedWine] = React.useState<Wine | null>(null);
    const { t } = useTranslations();

    if (wines.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-center px-4">
                <p className="text-lg">{t.feed.empty}</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {wines.map((wine) => (
                    <div key={wine.id}>
                        <WineCard
                            wine={wine}
                            onClick={() => setSelectedWine(wine)}
                            readonly
                        />
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 px-1">
                            <Link
                                href={`/u/${wine.user.username}`}
                                className="hover:underline hover:text-violet-600"
                            >
                                {t.feed.by.replace("{username}", wine.user.username)}
                            </Link>
                        </p>
                    </div>
                ))}
            </div>
            <AnimatePresence>
                {selectedWine && (
                    <WineModal
                        wine={selectedWine}
                        onClose={() => setSelectedWine(null)}
                        readonly
                    />
                )}
            </AnimatePresence>
        </>
    );
}
