"use client";

import * as React from "react";
import { Wine } from "@prisma/client";
import { WineCard } from "@/components/WineCard";
import { useTranslations } from "@/components/LanguageContext";
import { groupWinesByMonth } from "@/lib/utils";

interface WineGridProps {
    wines: Wine[];
    onWineClick: (wine: Wine) => void;
    readonly?: boolean;
}

export function WineGrid({ wines, onWineClick, readonly }: WineGridProps) {
    const { t, lang } = useTranslations();

    if (wines.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <p className="text-lg">{t.wineGrid.emptyTitle}</p>
                <p className="text-sm">{t.wineGrid.emptySubtitle}</p>
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
                                    onClick={() => onWineClick(wine)}
                                    readonly={readonly}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </>
    );
}
