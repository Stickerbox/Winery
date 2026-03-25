"use client";

import * as React from "react";
import { Wine } from "@prisma/client";
import { X, Calendar, Trash2, Share2, Check, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RatingStar } from "@/components/ui/RatingStar";
import { motion, AnimatePresence } from "framer-motion";
import { deleteWine, generateShareToken } from "@/app/actions";
import { useTranslations } from "@/components/LanguageContext";
import { useSwipeable } from "react-swipeable";

interface WineModalProps {
    wine: Wine;
    onClose: () => void;
    onDelete?: () => void;
    hasPrev: boolean;
    hasNext: boolean;
    onPrev: () => void;
    onNext: () => void;
}

export function WineModal({ wine, onClose, onDelete, hasPrev, hasNext, onPrev, onNext }: WineModalProps) {
    const [copied, setCopied] = React.useState(false);
    const [confirmingDelete, setConfirmingDelete] = React.useState(false);
    const [deleting, setDeleting] = React.useState(false);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);
    const { t, lang } = useTranslations();
    const openedForWineId = React.useRef(wine.id);
    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => { if (hasNext && !confirmingDelete) onNext(); },
        onSwipedRight: () => { if (hasPrev && !confirmingDelete) onPrev(); },
        preventScrollOnSwipe: true,
    });

    React.useEffect(() => {
        setConfirmingDelete(false);
        setDeleting(false);
        setDeleteError(null);
        setCopied(false);
    }, [wine.id]);

    const saqUrl = `https://www.saq.com/${lang}/catalogsearch/result/?q=${encodeURIComponent(wine.name)}&catalog_type=1&availability_front=Online&availability_front=In%20store`;

    React.useEffect(() => {
        if (!confirmingDelete) return;
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape" && !deleting) {
                setConfirmingDelete(false);
                setDeleteError(null);
            }
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [confirmingDelete, deleting]);

    React.useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (confirmingDelete) return;
            if (e.key === "ArrowLeft" && hasPrev) onPrev();
            if (e.key === "ArrowRight" && hasNext) onNext();
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [hasPrev, hasNext, onPrev, onNext, onClose, confirmingDelete]);

    async function handleDelete() {
        setDeleting(true);
        try {
            await deleteWine(wine.id);
            onClose();
            onDelete?.();
        } catch {
            setDeleteError(t.wineModal.deleteFailed);
        } finally {
            setDeleting(false);
        }
    }

    async function handleShare() {
        const token = await generateShareToken(wine.id);
        const url = `${window.location.origin}/share/${token}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: wine.name, url });
                return;
            }
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // share/clipboard unavailable
        }
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={confirmingDelete ? undefined : onClose}
            />
            <div {...swipeHandlers} className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <Button
                    size="icon"
                    variant="ghost"
                    aria-label={t.wineModal.prevWine}
                    disabled={!hasPrev}
                    onClick={onPrev}
                    className="hidden md:flex pointer-events-auto shrink-0 rounded-full mr-2 text-white bg-black/20 hover:bg-black/40 disabled:opacity-20 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>

                <motion.div
                    layoutId={`wine-${openedForWineId.current}`}
                    className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl pointer-events-auto flex flex-col md:flex-row max-h-[90vh]"
                >
                    <motion.div
                        key={`img-${wine.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        className="relative w-full md:w-1/2 h-64 md:h-auto bg-zinc-100 dark:bg-zinc-800"
                    >
                        <img
                            src={wine.imagePath}
                            alt={wine.name}
                            className="w-full h-full object-cover"
                        />
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-4 left-4 bg-black/20 hover:bg-black/40 text-white rounded-full md:hidden"
                            onClick={onClose}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </motion.div>

                    <motion.div
                        key={`content-${wine.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <motion.h2 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white">
                                    {wine.name}
                                </motion.h2>
                                <div className="flex items-center text-zinc-500 dark:text-zinc-400 text-sm">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {new Date(wine.createdAt).toLocaleDateString()}
                                </div>
                                {wine.sharedByUsername && (
                                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 ring-1 ring-violet-200 dark:ring-violet-700/50">
                                        {t.share.sharedBy.replace("{username}", wine.sharedByUsername)}
                                    </span>
                                )}
                                <a
                                    href={saqUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 mt-1 text-sm text-violet-600 dark:text-violet-400 hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    {t.wineModal.goToSAQ}
                                </a>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="hidden md:flex rounded-full"
                                onClick={onClose}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    {t.common.rating}
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden rounded-full text-zinc-500 dark:text-zinc-400"
                                    onClick={handleShare}
                                >
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
                                </Button>
                            </div>
                            <RatingStar rating={wine.rating} readonly className="gap-2 [&_svg]:w-8 [&_svg]:h-8" />
                        </div>

                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                                {t.wineModal.tastingNotes}
                            </h3>
                            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                {wine.description}
                            </p>
                        </div>

                        <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                            <Button
                                variant="ghost"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 gap-2"
                                onClick={() => setConfirmingDelete(true)}
                            >
                                <Trash2 className="h-4 w-4" />
                                {t.common.delete}
                            </Button>
                            <Button
                                variant="ghost"
                                className="hidden md:flex gap-2 text-zinc-600 dark:text-zinc-400"
                                onClick={handleShare}
                            >
                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
                                {copied ? t.common.copied : t.common.share}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>

                <Button
                    size="icon"
                    variant="ghost"
                    aria-label={t.wineModal.nextWine}
                    disabled={!hasNext}
                    onClick={onNext}
                    className="hidden md:flex pointer-events-auto shrink-0 rounded-full ml-2 text-white bg-black/20 hover:bg-black/40 disabled:opacity-20 disabled:cursor-not-allowed"
                >
                    <ChevronRight className="h-6 w-6" />
                </Button>
            </div>
            <AnimatePresence>
                {confirmingDelete && (
                    <>
                        <motion.div
                            key="confirm-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-[60]"
                            onClick={() => {
                                if (!deleting) { setConfirmingDelete(false); setDeleteError(null); }
                            }}
                        />
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
                            <motion.div
                                key="confirm-card"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl pointer-events-auto"
                            >
                                <p className="text-zinc-900 dark:text-white font-semibold text-lg mb-2">
                                    {t.wineModal.deleteConfirm}
                                </p>
                                {deleteError && (
                                    <p className="text-red-500 text-sm mb-4">{deleteError}</p>
                                )}
                                <div className="flex gap-3 justify-end">
                                    <Button
                                        variant="ghost"
                                        onClick={() => { if (!deleting) { setConfirmingDelete(false); setDeleteError(null); } }}
                                        disabled={deleting}
                                    >
                                        {t.common.cancel}
                                    </Button>
                                    <Button
                                        className="bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                                        onClick={handleDelete}
                                        disabled={deleting}
                                    >
                                        {deleting ? t.wineModal.deleting : t.wineModal.deleteConfirmAction}
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
