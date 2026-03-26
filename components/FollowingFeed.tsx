"use client";

import * as React from "react";
import { Wine, WishlistItem } from "@prisma/client";
import { WineCard } from "@/components/WineCard";
import { WineModal } from "@/components/WineModal";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "@/components/LanguageContext";
import { addToWishlist, removeFromWishlist } from "@/app/actions";
import Link from "next/link";
import { groupWinesByMonth } from "@/lib/utils";

type FeedWine = Wine & { user: { username: string } };

interface FollowingFeedProps {
    wines: FeedWine[];
    wishlistItems: WishlistItem[];
}

export function FollowingFeed({ wines, wishlistItems }: FollowingFeedProps) {
    const [selectedWine, setSelectedWine] = React.useState<FeedWine | null>(null);
    const [localWishlistItems, setLocalWishlistItems] = React.useState<WishlistItem[]>(wishlistItems);
    const { t, lang } = useTranslations();
    const pendingKeys = React.useRef(new Set<string>());

    const wishlistItemsJson = JSON.stringify(wishlistItems.map((i) => i.id).sort());
    React.useEffect(() => {
        setLocalWishlistItems(wishlistItems);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wishlistItemsJson]);

    const wishlistMap = React.useMemo(
        () => new Map(localWishlistItems.map((i) => [`${i.name}::${i.addedByUsername}`, i.id])),
        [localWishlistItems]
    );

    async function handleWishlistToggle(wine: FeedWine) {
        const key = `${wine.name}::${wine.user.username}`;
        if (pendingKeys.current.has(key)) return;
        pendingKeys.current.add(key);

        const existingId = wishlistMap.get(key);
        if (existingId === undefined) {
            const pseudoItem: WishlistItem = {
                id: -Date.now(),
                userId: -1,
                name: wine.name,
                description: wine.description,
                imagePath: wine.imagePath,
                addedByUsername: wine.user.username,
                createdAt: new Date(),
            };
            setLocalWishlistItems((prev) => [...prev, pseudoItem]);
            try {
                await addToWishlist(wine.id);
            } catch {
                setLocalWishlistItems((prev) => prev.filter((i) => i.id !== pseudoItem.id));
            } finally {
                pendingKeys.current.delete(key);
            }
        } else {
            setLocalWishlistItems((prev) => prev.filter((i) => i.id !== existingId));
            try {
                await removeFromWishlist(existingId);
            } catch {
                setLocalWishlistItems(wishlistItems);
            } finally {
                pendingKeys.current.delete(key);
            }
        }
    }

    if (wines.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-center px-4">
                <p className="text-lg">{t.feed.empty}</p>
            </div>
        );
    }

    const groups = groupWinesByMonth(wines, lang);

    return (
        <>
            {groups.map(({ label, wines: groupWines }) => (
                <div key={label}>
                    <h2 className="text-2xl font-bold text-zinc-400 dark:text-zinc-500 px-4 pt-6 pb-2">
                        {label}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 pb-4">
                        {groupWines.map((wine) => (
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
                </div>
            ))}
            <AnimatePresence>
                {selectedWine && (
                    <WineModal
                        wine={selectedWine}
                        onClose={() => setSelectedWine(null)}
                        readonly
                        isWishlisted={wishlistMap.has(`${selectedWine.name}::${selectedWine.user.username}`)}
                        onWishlistToggle={() => handleWishlistToggle(selectedWine)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
