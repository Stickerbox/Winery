"use client";

import * as React from "react";
import { Wine, User, WishlistItem } from "@prisma/client";
import { WineGrid } from "@/components/WineGrid";
import { WineModal } from "@/components/WineModal";
import { FollowButton } from "@/components/FollowButton";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "@/components/LanguageContext";
import Link from "next/link";
import { Check, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { addToWishlist, removeFromWishlist } from "@/app/actions";

type ProfileUser = User & { wines: Wine[] };

interface ProfileViewProps {
    profile: ProfileUser;
    currentUserId: number | null;
    initialIsFollowing: boolean;
    wishlistItems?: WishlistItem[];
}

export function ProfileView({ profile, currentUserId, initialIsFollowing, wishlistItems = [] }: ProfileViewProps) {
    const [selectedWine, setSelectedWine] = React.useState<Wine | null>(null);
    const [copied, setCopied] = React.useState(false);
    const [localWishlistItems, setLocalWishlistItems] = React.useState<WishlistItem[]>(wishlistItems);
    const { t } = useTranslations();
    const pendingKeys = React.useRef(new Set<string>());

    const showFollowButton = currentUserId !== null && currentUserId !== profile.id;
    const isOwnProfile = currentUserId === profile.id;
    const canWishlist = currentUserId !== null && currentUserId !== profile.id;

    const wishlistItemsJson = JSON.stringify(wishlistItems.map((i) => i.id).sort());
    React.useEffect(() => {
        setLocalWishlistItems(wishlistItems);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wishlistItemsJson]);

    const wishlistMap = React.useMemo(
        () => new Map(localWishlistItems.map((i) => [`${i.name}::${i.addedByUsername}`, i.id])),
        [localWishlistItems]
    );

    async function handleWishlistToggle(wine: Wine) {
        const key = `${wine.name}::${profile.username}`;
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
                addedByUsername: profile.username,
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
            const removedItem = localWishlistItems.find((i) => i.id === existingId)!;
            setLocalWishlistItems((prev) => prev.filter((i) => i.id !== existingId));
            try {
                await removeFromWishlist(existingId);
            } catch {
                setLocalWishlistItems((prev) => [...prev, removedItem]);
            } finally {
                pendingKeys.current.delete(key);
            }
        }
    }

    function handleCopyLink() {
        if (!navigator.clipboard) return;
        const url = `${window.location.origin}/u/${profile.username}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {});
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <Link href="/" className="text-sm text-violet-600 hover:underline">
                        VinoVault
                    </Link>
                    <div className="flex items-center gap-2">
                        {isOwnProfile && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                                onClick={handleCopyLink}
                                title={t.profile.copyLink}
                            >
                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <LinkIcon className="h-4 w-4" />}
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto max-w-7xl">
                <div className="text-center py-6 px-4">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                        {profile.username}
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {t.profile.wineCount.replace("{count}", String(profile.wines.length))}
                    </p>
                    {showFollowButton && (
                        <div className="mt-3">
                            <FollowButton
                                userId={profile.id}
                                initialIsFollowing={initialIsFollowing}
                                className="rounded-full px-6"
                            />
                        </div>
                    )}
                </div>

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
                        isWishlisted={canWishlist ? wishlistMap.has(`${selectedWine.name}::${profile.username}`) : undefined}
                        onWishlistToggle={canWishlist ? () => handleWishlistToggle(selectedWine) : undefined}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
