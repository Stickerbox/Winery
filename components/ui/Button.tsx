import * as React from "react";
import { cn } from "@/lib/utils";


export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        // Base styles
        const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

        // Sizes
        const sizes = {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8",
            icon: "h-10 w-10",
        };

        const premiumVariants = {
            default: "bg-violet-600 text-white hover:bg-violet-700 shadow-md shadow-violet-200 dark:shadow-none",
            destructive: "bg-red-500 text-white hover:bg-red-600",
            outline: "border border-white/40 dark:border-white/25 bg-white/20 dark:bg-white/10 hover:bg-white/35 dark:hover:bg-white/20 text-zinc-900 dark:text-white",
            secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700",
            ghost: "hover:bg-white/20 dark:hover:bg-white/15 text-zinc-900 dark:text-white",
            link: "text-violet-600 underline-offset-4 hover:underline",
        };

        return (
            <button
                className={cn(
                    baseStyles,
                    premiumVariants[variant],
                    sizes[size],
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
