import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Note: I'm not using class-variance-authority yet as I didn't install it, 
// but I can implement a simple version or just use clsx/tailwind-merge directly.
// Actually, standard shadcn/ui uses cva. I should probably install it or just write simple conditional classes.
// I'll write simple conditional classes to avoid extra deps for now, or I can install `class-variance-authority`.
// Given the instructions to be "premium", cva is nice. I'll install it quickly.
// Wait, I can't install mid-stream easily without breaking flow.
// I'll just write a robust component without cva for now, it's just as good.

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";

        // Base styles
        const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

        // Variants
        const variants = {
            default: "bg-primary text-primary-foreground hover:bg-primary/90",
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            link: "text-primary underline-offset-4 hover:underline",
        };

        // Sizes
        const sizes = {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8",
            icon: "h-10 w-10",
        };

        // I need to define these colors in globals.css or just use standard tailwind colors.
        // For now I'll use standard tailwind colors mapped to these names in the class string if needed, 
        // but better to use the variables I saw in globals.css (background, foreground).
        // I'll assume standard shadcn-like variables are or will be set up. 
        // Actually, globals.css only had background/foreground.
        // I should update globals.css to include primary, secondary, etc.
        // Or I can just use hardcoded tailwind colors for this MVP.
        // I'll use hardcoded colors for "premium" look (e.g. violet/purple for primary).

        const premiumVariants = {
            default: "bg-violet-600 text-white hover:bg-violet-700 shadow-md shadow-violet-200 dark:shadow-none",
            destructive: "bg-red-500 text-white hover:bg-red-600",
            outline: "border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800 dark:text-zinc-50",
            secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700",
            ghost: "hover:bg-zinc-100 text-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-50",
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
