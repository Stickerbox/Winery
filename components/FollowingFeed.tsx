"use client";

import * as React from "react";
import { Wine } from "@prisma/client";
import { WineCard } from "@/components/WineCard";
import { WineModal } from "@/components/WineModal";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "@/components/LanguageContext";
import { addToWishlist } from "@/app/actions";
import { Bookmark } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type FeedWine = Wine & { user: { username: string } };

interface FollowingFeedProps {
    wines: FeedWine[];
    wishlistedKeys: Set<string>;
}

export function FollowingFeed({ wines, wishlistedKeys }: FollowingFeedProps) {
    const [selectedWine, setSelectedWine] = React.useState<FeedWine | null>(null);
    const [localWishlisted, setLocalWishlisted] = React.useState<Set<string>>(new Set(wishlistedKeys));
    const { t } = useTranslations();

    // Sync if parent's wishlistedKeys changes (e.g. after server revalidation)
    React.useEffect(() => {
        setLocalWishlisted(new Set(wishlistedKeys));
    }, [wishlistedKeys]);

    async function handleWishlist(wine: FeedWine) {
        const key = `${wine.name}::${wine.user.username}`;
        if (localWishlisted.has(key)) return; // already wishlisted — no toggle
        setLocalWishlisted((prev) => new Set([...prev, key])); // optimistic
        try {
            await addToWishlist(wine.id);
        } catch {
            // revert on failure
            setLocalWishlisted((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }
    }

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
                {wines.map((wine) => {
                    const key = `${wine.name}::${wine.user.username}`;
                    const isWishlisted = localWishlisted.has(key);
                    return (
                        <div key={wine.id}>
                            <WineCard
                                wine={wine}
                                onClick={() => setSelectedWine(wine)}
                                readonly
                            />
                            <div className="flex items-center justify-between mt-1 px-1">
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    <Link
                                        href={`/u/${wine.user.username}`}
                                        className="hover:underline hover:text-violet-600"
                                    >
                                        {t.feed.by.replace("{username}", wine.user.username)}
                                    </Link>
                                </p>
                                <button
                                    onClick={() => handleWishlist(wine)}
                                    title={isWishlisted ? t.wishlist.wishlisted : t.wishlist.addToWishlist}
                                    className={cn(
                                        "p-1 rounded transition-colors",
                                        isWishlisted
                                            ? "text-violet-600 dark:text-violet-400"
                                            : "text-zinc-400 hover:text-violet-500 dark:text-zinc-500 dark:hover:text-violet-400"
                                    )}
                                >
                                    <Bookmark className={cn("h-4 w-4", isWishlisted && "fill-current")} />
                                </button>
                            </div>
                        </div>
                    );
                })}
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
