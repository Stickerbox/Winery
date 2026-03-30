import { getWines, getFollowingFeed, getWishlist } from "./actions";
import { getCurrentUser, getPasskeys } from "./auth-actions";
import { Dashboard } from "@/components/Dashboard";
import { redirect } from "next/navigation";

export default async function Home() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const [wines, feedWines, wishlistItems, passkeys] = await Promise.all([
        getWines(),
        getFollowingFeed(),
        getWishlist(),
        getPasskeys(),
    ]);

    return <Dashboard wines={wines} user={user} feedWines={feedWines} wishlistItems={wishlistItems} passkeys={passkeys} />;
}
