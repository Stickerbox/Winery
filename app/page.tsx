import { getWines, getFollowingFeed, getWishlist } from "./actions";
import { getCurrentUser } from "./auth-actions";
import { Dashboard } from "@/components/Dashboard";
import { redirect } from "next/navigation";

export default async function Home() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const [wines, feedWines, wishlistItems] = await Promise.all([
        getWines(),
        getFollowingFeed(),
        getWishlist(),
    ]);

    return <Dashboard wines={wines} user={user} feedWines={feedWines} wishlistItems={wishlistItems} />;
}
