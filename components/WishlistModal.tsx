"use client";

import * as React from "react";
import { WishlistItem } from "@prisma/client";
import { X, BookmarkPlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { useTranslations } from "@/components/LanguageContext";

interface WishlistModalProps {
    item: WishlistItem;
    onClose: () => void;
    onMoveToCollection?: () => void;
    onRemove?: () => void;
}

export function WishlistModal({ item, onClose, onMoveToCollection, onRemove }: WishlistModalProps) {
    const { t } = useTranslations();
    React.useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                onClick={onClose}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 16 }}
                    transition={{ duration: 0.18 }}
                    className="w-full max-w-sm bg-white/75 dark:bg-white/20 backdrop-blur-xl border border-white/50 dark:border-white/25 rounded-2xl overflow-hidden shadow-[var(--glass-shadow)] pointer-events-auto"
                >
                    <div className="relative w-full aspect-[4/3] bg-white/10">
                        {item.imagePath ? (
                            <img
                                src={item.imagePath}
                                alt={item.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                                <BookmarkPlus className="h-16 w-16 text-zinc-300 dark:text-zinc-600" />
                            </div>
                        )}
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-3 left-3 bg-black/20 hover:bg-black/40 text-white rounded-full"
                            onClick={onClose}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                        {(onMoveToCollection || onRemove) && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                                {onRemove && (
                                    <button
                                        onClick={() => { onRemove(); onClose(); }}
                                        className="px-3 py-2 rounded-full backdrop-blur-sm bg-black/40 hover:bg-black/60 text-white text-sm flex items-center gap-1.5 whitespace-nowrap transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        {t.wishlist.removeFromWishlist}
                                    </button>
                                )}
                                {onMoveToCollection && (
                                    <button
                                        onClick={() => { onMoveToCollection(); onClose(); }}
                                        className="px-3 py-2 rounded-full backdrop-blur-sm bg-violet-600/70 hover:bg-violet-700/70 text-white text-sm flex items-center gap-1.5 whitespace-nowrap transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                        {t.wishlist.moveToCollection}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                            {item.name}
                        </h2>
                        {item.description && (
                            <p className="text-zinc-600 dark:text-white/70 leading-relaxed">
                                {item.description}
                            </p>
                        )}
                    </div>
                </motion.div>
            </div>
        </>
    );
}
