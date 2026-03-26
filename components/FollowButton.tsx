"use client";

import * as React from "react";
import { followUser, unfollowUser } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/components/LanguageContext";

interface FollowButtonProps {
    userId: number;
    initialIsFollowing: boolean;
    className?: string;
}

export function FollowButton({ userId, initialIsFollowing, className }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = React.useState(initialIsFollowing);
    const [isPending, setIsPending] = React.useState(false);
    React.useEffect(() => {
        setIsFollowing(initialIsFollowing);
    }, [initialIsFollowing]);
    const { t } = useTranslations();

    async function handleClick() {
        if (isPending) return;
        setIsPending(true);
        const prev = isFollowing;
        setIsFollowing(!prev);
        try {
            if (prev) {
                await unfollowUser(userId);
            } else {
                await followUser(userId);
            }
        } catch {
            setIsFollowing(prev);
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Button
            onClick={handleClick}
            disabled={isPending}
            variant={isFollowing ? "ghost" : "default"}
            className={className}
        >
            {isFollowing ? t.profile.unfollow : t.profile.follow}
        </Button>
    );
}
