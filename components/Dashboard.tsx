"use client";

import * as React from "react";
import { Wine, User } from "@prisma/client";
import { Plus, X, LogOut, Search, Wine as WineIcon, Users, Bookmark } from "lucide-react";
import { WineGrid } from "@/components/WineGrid";
import { WineModal } from "@/components/WineModal";
import { WineForm } from "@/components/WineForm";
import { Button } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { logout } from "@/app/auth-actions";
import { useTranslations } from "@/components/LanguageContext";
import { FollowingFeed } from "@/components/FollowingFeed";

type FeedWine = Wine & { user: { username: string } };

interface DashboardProps {
    wines: Wine[];
    user: User;
    feedWines: FeedWine[];
}

export function Dashboard({ wines, user, feedWines }: DashboardProps) {
    const [isAddOpen, setIsAddOpen] = React.useState(false);
    const [selectedWine, setSelectedWine] = React.useState<Wine | null>(null);
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [sortBy, setSortBy] = React.useState<"newest" | "oldest" | "rating-high" | "rating-low">("newest");
    const [activeTab, setActiveTab] = React.useState<"collection" | "following" | "wishlist">("collection");
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const { t } = useTranslations();

    const filteredWines = React.useMemo(() => {
        let result = searchQuery.trim()
            ? wines.filter((w) =>
                  w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  w.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : [...wines];

        result.sort((a, b) => {
            if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            if (sortBy === "rating-high") return b.rating - a.rating;
            if (sortBy === "rating-low") return a.rating - b.rating;
            return 0;
        });

        return result;
    }, [wines, searchQuery, sortBy]);

    const handleSearchToggle = () => {
        if (isSearchOpen) {
            setIsSearchOpen(false);
            setSearchQuery("");
        } else {
            setIsSearchOpen(true);
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
    };

    const selectedIndex = React.useMemo(
        () => (selectedWine ? filteredWines.findIndex((w) => w.id === selectedWine.id) : -1),
        [filteredWines, selectedWine]
    );

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                            VinoVault
                        </h1>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400 hidden sm:inline-block">
                            {t.dashboard.welcome.replace("{username}", user.username)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                        >
                            <option value="newest">{t.dashboard.sortNewest}</option>
                            <option value="oldest">{t.dashboard.sortOldest}</option>
                            <option value="rating-high">{t.dashboard.sortRatingHigh}</option>
                            <option value="rating-low">{t.dashboard.sortRatingLow}</option>
                        </select>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            onClick={handleSearchToggle}
                            title={t.dashboard.searchTitle}
                        >
                            {isSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                        </Button>
                        <form action={logout}>
                            <Button variant="ghost" size="icon" className="rounded-full" title={t.dashboard.logoutTitle}>
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
                <AnimatePresence>
                    {isSearchOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t.dashboard.searchPlaceholder}
                                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <main className="container mx-auto max-w-7xl">
                <div className="hidden sm:flex border-b border-zinc-200 dark:border-zinc-800 px-4">
                    {(["collection", "following", "wishlist"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                                activeTab === tab
                                    ? "border-violet-600 text-violet-600"
                                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                            )}
                        >
                            {tab === "collection"
                                ? t.dashboard.tabCollection
                                : tab === "following"
                                ? t.dashboard.tabFollowing
                                : t.dashboard.tabWishlist}
                        </button>
                    ))}
                </div>

                {activeTab === "collection" && (
                    <WineGrid
                        wines={filteredWines}
                        onWineClick={(wine) => setSelectedWine(wine)}
                    />
                )}
                {activeTab === "following" && <FollowingFeed wines={feedWines} />}
                {activeTab === "wishlist" && null}

                <div className="flex justify-center pb-6">
                    <LanguageToggle />
                </div>
            </main>

            {/* Add Wine Modal */}
            <AnimatePresence>
                {isAddOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                            onClick={() => setIsAddOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="w-full max-w-sm pointer-events-auto relative max-h-[90vh] overflow-y-auto rounded-2xl">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute -top-12 right-0 text-white hover:bg-white/20 rounded-full"
                                    onClick={() => setIsAddOpen(false)}
                                >
                                    <X className="h-6 w-6" />
                                </Button>
                                <WineForm onSuccess={() => setIsAddOpen(false)} />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Floating Add Button */}
            <button
                onClick={() => setIsAddOpen(true)}
                className="fixed bottom-6 right-6 z-30 h-14 w-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-2xl font-light"
                title={t.dashboard.addWineTitle}
            >
                <Plus className="h-6 w-6" />
            </button>

            {/* Wine Details Modal */}
            <AnimatePresence>
                {selectedWine && (
                    <WineModal
                        wine={selectedWine}
                        onClose={() => setSelectedWine(null)}
                        hasPrev={selectedIndex > 0}
                        hasNext={selectedIndex !== -1 && selectedIndex < filteredWines.length - 1}
                        onPrev={() => setSelectedWine(filteredWines[selectedIndex - 1])}
                        onNext={() => setSelectedWine(filteredWines[selectedIndex + 1])}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
