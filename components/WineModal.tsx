"use client";

import * as React from "react";
import { Wine } from "@prisma/client";
import { X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RatingStar } from "@/components/ui/RatingStar";
import { motion } from "framer-motion";

interface WineModalProps {
    wine: Wine;
    onClose: () => void;
}

export function WineModal({ wine, onClose }: WineModalProps) {
    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={onClose}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                    layoutId={`wine-${wine.id}`}
                    className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl pointer-events-auto flex flex-col md:flex-row max-h-[90vh]"
                >
                    <div className="relative w-full md:w-1/2 h-64 md:h-auto bg-zinc-100 dark:bg-zinc-800">
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
                    </div>

                    <div className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <motion.h2 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white">
                                    {wine.name}
                                </motion.h2>
                                <div className="flex items-center text-zinc-500 dark:text-zinc-400 text-sm">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {new Date(wine.createdAt).toLocaleDateString()}
                                </div>
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
                            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                                Rating
                            </h3>
                            <RatingStar rating={wine.rating} readonly className="gap-2 [&_svg]:w-8 [&_svg]:h-8" />
                        </div>

                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                                Tasting Notes
                            </h3>
                            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                {wine.description}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
