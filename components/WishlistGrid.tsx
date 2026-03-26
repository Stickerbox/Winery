"use client";

import * as React from "react";
import { WishlistItem } from "@prisma/client";
import { Trash2, BookmarkPlus, X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { removeFromWishlist, moveToCollection } from "@/app/actions";
import { WineForm } from "@/components/WineForm";
import { WishlistModal } from "@/components/WishlistModal";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/components/LanguageContext";

interface WishlistGridProps {
    items: WishlistItem[];
}

export function WishlistGrid({ items }: WishlistGridProps) {
    const [movingItem, setMovingItem] = React.useState<WishlistItem | null>(null);
    const [selectedItem, setSelectedItem] = React.useState<WishlistItem | null>(null);
    const movingItemRef = React.useRef<WishlistItem | null>(null);
    const { t } = useTranslations();

    React.useEffect(() => {
        movingItemRef.current = movingItem;
    }, [movingItem]);

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-center px-4">
                <p className="text-lg">{t.wishlist.empty}</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {items.map((item) => (
                    <div key={item.id} className="flex flex-col">
                        <div
                            className="relative rounded-xl overflow-hidden bg-white/10 border border-white/20 aspect-[4/5] cursor-pointer"
                            onClick={() => setSelectedItem(item)}
                        >
                            {item.imagePath ? (
                                <img
                                    src={item.imagePath}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                                    <BookmarkPlus className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                                <p className="font-bold text-sm leading-tight line-clamp-2">{item.name}</p>
                            </div>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 px-1">
                            {t.wishlist.by.replace("{username}", item.addedByUsername)}
                        </p>
                        <div className="flex gap-2 mt-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 h-8 w-8 shrink-0"
                                title={t.wishlist.removeFromWishlist}
                                onClick={async () => {
                                    try {
                                        await removeFromWishlist(item.id);
                                    } catch {
                                        alert("Failed to remove from wishlist.");
                                    }
                                }}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <button
                                className="flex-1 rounded-full px-3 py-1.5 text-xs flex items-center justify-center gap-1.5 bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900 transition-colors"
                                onClick={() => setMovingItem(item)}
                            >
                                <Plus className="h-3.5 w-3.5" />
                                {t.wishlist.moveToCollection}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Wishlist Item Detail Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <WishlistModal
                        item={selectedItem}
                        onClose={() => setSelectedItem(null)}
                    />
                )}
            </AnimatePresence>

            {/* Move to Collection Modal */}
            <AnimatePresence>
                {movingItem && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                            onClick={() => setMovingItem(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="w-full max-w-sm pointer-events-auto relative max-h-[90vh] overflow-y-auto rounded-2xl">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute -top-12 right-0 text-white hover:bg-white/20 rounded-full"
                                    onClick={() => setMovingItem(null)}
                                >
                                    <X className="h-6 w-6" />
                                </Button>
                                <WineForm
                                    initialValues={{ name: movingItem.name, description: movingItem.description }}
                                    skipAnalysis={true}
                                    onSubmit={async (formData) => {
                                        if (!movingItemRef.current) return;
                                        await moveToCollection(movingItemRef.current.id, formData);
                                    }}
                                    onSuccess={() => setMovingItem(null)}
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
