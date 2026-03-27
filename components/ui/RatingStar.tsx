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
    const displayRating = hoverRating ?? rating;

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {Array.from({ length: maxRating }).map((_, index) => {
                const halfValue = index + 0.5;
                const fullValue = index + 1;
                const fillAmount =
                    displayRating >= fullValue ? "full" :
                    displayRating >= halfValue ? "half" :
                    "empty";

                return (
                    <div key={index} className="relative">
                        {/* Background empty star */}
                        <Star className="h-6 w-6 fill-transparent text-zinc-300 dark:text-zinc-600" />
                        {/* Filled overlay — clipped to left 50% for half, full width for full */}
                        {fillAmount !== "empty" && (
                            <div
                                className="absolute inset-0 overflow-hidden"
                                style={{ width: fillAmount === "half" ? "50%" : "100%" }}
                            >
                                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                            </div>
                        )}
                        {/* Invisible hit zones (interactive mode only) */}
                        {!readonly && (
                            <>
                                <button
                                    type="button"
                                    className="absolute inset-y-0 left-0 w-1/2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-1"
                                    onMouseEnter={() => setHoverRating(halfValue)}
                                    onMouseLeave={() => setHoverRating(null)}
                                    onClick={() => onRatingChange?.(halfValue)}
                                    aria-label={`Rate ${halfValue} out of ${maxRating}`}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 w-1/2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-1"
                                    onMouseEnter={() => setHoverRating(fullValue)}
                                    onMouseLeave={() => setHoverRating(null)}
                                    onClick={() => onRatingChange?.(fullValue)}
                                    aria-label={`Rate ${fullValue} out of ${maxRating}`}
                                />
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
