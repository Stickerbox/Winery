import { getWines, getFollowingFeed } from "./actions";
import { getCurrentUser } from "./auth-actions";
import { Dashboard } from "@/components/Dashboard";
import { redirect } from "next/navigation";

export default async function Home() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const [wines, feedWines] = await Promise.all([getWines(), getFollowingFeed()]);

    return <Dashboard wines={wines} user={user} feedWines={feedWines} />;
}
