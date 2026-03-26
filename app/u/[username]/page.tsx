import { getUserProfile, getIsFollowing, getWishlist } from "@/app/actions";
import { getCurrentUser } from "@/app/auth-actions";
import { ProfileView } from "@/components/ProfileView";
import { notFound } from "next/navigation";

export default async function ProfilePage({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const { username } = await params;

    const profile = await getUserProfile(username);
    if (!profile) notFound();

    const currentUser = await getCurrentUser();
    const [isFollowing, wishlistItems] = await Promise.all([
        getIsFollowing(profile.id),
        currentUser ? getWishlist() : Promise.resolve([]),
    ]);

    return (
        <ProfileView
            profile={profile}
            currentUserId={currentUser?.id ?? null}
            initialIsFollowing={isFollowing}
            wishlistItems={wishlistItems}
        />
    );
}
