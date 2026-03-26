"use client";

import * as React from "react";
import { BookmarkPlus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { RatingStar } from "@/components/ui/RatingStar";
import { motion } from "framer-motion";

interface WineCardItem {
    id: number;
    imagePath: string | null;
    name: string;
    rating?: number;
}

interface WineCardProps {
    wine: WineCardItem;
    onClick?: () => void;
    readonly?: boolean;
    hideRating?: boolean;
}

export function WineCard({ wine, onClick, readonly, hideRating }: WineCardProps) {
    return (
        <motion.div
            layoutId={`wine-${wine.id}`}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <Card
                className="overflow-hidden cursor-pointer group transition-shadow hover:shadow-[var(--glass-shadow-hover)]"
                onClick={onClick}
            >
                <div className="aspect-[4/5] relative overflow-hidden bg-white/10">
                    {wine.imagePath ? (
                        <img
                            src={wine.imagePath}
                            alt={wine.name}
                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                            <BookmarkPlus className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-bold text-lg leading-tight mb-1">{wine.name}</h3>
                        {!hideRating && wine.rating !== undefined && (
                            <RatingStar rating={wine.rating} readonly className="[&_svg]:text-white/50 [&_svg.fill-yellow-400]:text-yellow-400" />
                        )}
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
