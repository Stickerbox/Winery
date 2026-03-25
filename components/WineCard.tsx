"use client";

import * as React from "react";
import { Wine } from "@prisma/client";
import { Card, CardContent, CardFooter } from "@/components/ui/Card";
import { RatingStar } from "@/components/ui/RatingStar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface WineCardProps {
    wine: Wine;
    onClick?: () => void;
    readonly?: boolean;
}

export function WineCard({ wine, onClick, readonly }: WineCardProps) {
    return (
        <motion.div
            layoutId={`wine-${wine.id}`}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <Card
                className="overflow-hidden cursor-pointer group hover:shadow-xl transition-shadow border-0 ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900"
                onClick={onClick}
            >
                <div className="aspect-[4/5] relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <img
                        src={wine.imagePath}
                        alt={wine.name}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-bold text-lg leading-tight mb-1">{wine.name}</h3>
                        <RatingStar rating={wine.rating} readonly className="[&_svg]:text-white/50 [&_svg.fill-yellow-400]:text-yellow-400" />
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
