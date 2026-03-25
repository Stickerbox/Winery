"use client";

import * as React from "react";
import { Wine } from "@prisma/client";
import { WineCard } from "@/components/WineCard";
import { useTranslations } from "@/components/LanguageContext";
import { motion } from "framer-motion";

interface WineGridProps {
    wines: Wine[];
    onWineClick: (wine: Wine) => void;
    readonly?: boolean;
}

export function WineGrid({ wines, onWineClick, readonly }: WineGridProps) {
    const { t } = useTranslations();

    if (wines.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <p className="text-lg">{t.wineGrid.emptyTitle}</p>
                <p className="text-sm">{t.wineGrid.emptySubtitle}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {wines.map((wine) => (
                <WineCard key={wine.id} wine={wine} onClick={() => onWineClick(wine)} readonly={readonly} />
            ))}
        </div>
    );
}
