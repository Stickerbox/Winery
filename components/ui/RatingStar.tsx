"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarProps {
    rating: number;
    maxRating?: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    className?: string;
}

export function RatingStar({
    rating,
    maxRating = 5,
    onRatingChange,
    readonly = false,
    className,
}: RatingStarProps) {
    const [hoverRating, setHoverRating] = React.useState<number | null>(null);

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {Array.from({ length: maxRating }).map((_, index) => {
                const starValue = index + 1;
                const isFilled = (hoverRating !== null ? hoverRating : rating) >= starValue;

                return (
                    <button
                        key={index}
                        type="button"
                        disabled={readonly}
                        className={cn(
                            "transition-transform hover:scale-110 focus:outline-none",
                            readonly ? "cursor-default" : "cursor-pointer"
                        )}
                        onMouseEnter={() => !readonly && setHoverRating(starValue)}
                        onMouseLeave={() => !readonly && setHoverRating(null)}
                        onClick={() => !readonly && onRatingChange?.(starValue)}
                    >
                        <Star
                            className={cn(
                                "h-6 w-6 transition-colors",
                                isFilled
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-transparent text-zinc-300 dark:text-zinc-600"
                            )}
                        />
                    </button>
                );
            })}
        </div>
    );
}
