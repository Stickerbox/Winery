"use client";

import * as React from "react";
import { Wine, User } from "@prisma/client";
import { Plus, X, LogOut, Search, Wine as WineIcon, Users, Bookmark, Share2 } from "lucide-react";
import { WineGrid } from "@/components/WineGrid";
import { WineModal } from "@/components/WineModal";
import { WineForm } from "@/components/WineForm";
import { Button } from "@/components/ui/Button";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { logout } from "@/app/auth-actions";
import { useTranslations } from "@/components/LanguageContext";
import { FollowingFeed } from "@/components/FollowingFeed";
import { WishlistGrid } from "@/components/WishlistGrid";
import { WishlistItem } from "@prisma/client";

type FeedWine = Wine & { user: { username: string } };

interface DashboardProps {
    wines: Wine[];
    user: User;
    feedWines: FeedWine[];
    wishlistItems: WishlistItem[];
}

const PickerPill = ({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) => (
    <button
        onClick={onClick}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-zinc-800 shadow-lg text-sm font-medium text-zinc-800 dark:text-white hover:bg-violet-50 dark:hover:bg-violet-950 border border-white/30 dark:border-white/20 transition-colors whitespace-nowrap"
    >
        <span aria-hidden="true">{emoji}</span> {label}
    </button>
);

export function Dashboard({ wines, user, feedWines, wishlistItems }: DashboardProps) {
    const [isPickerOpen, setIsPickerOpen] = React.useState(false);
    const [addMode, setAddMode] = React.useState<"collection" | "wishlist" | null>(null);
    const [selectedWine, setSelectedWine] = React.useState<Wine | null>(null);
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [sortBy, setSortBy] = React.useState<"newest" | "oldest" | "rating-high" | "rating-low">("newest");
    const [activeTab, setActiveTab] = React.useState<"collection" | "following" | "wishlist">("collection");
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const { t } = useTranslations();

    React.useEffect(() => {
        if (!isPickerOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsPickerOpen(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isPickerOpen]);

    function handleShareProfile() {
        const url = `${window.location.origin}/u/${user.username}`;
        if (navigator.share) {
            navigator.share({ title: user.username, url }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(url).catch(() => {});
        }
    }

    const filteredWines = React.useMemo(() => {
        const result = searchQuery.trim()
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
        <div className="min-h-screen pb-36 sm:pb-20">
            <header className="sticky top-0 z-10 bg-white/30 dark:bg-white/10 backdrop-blur-xl border-b border-white/30 dark:border-white/20 px-4 py-3 flex flex-col gap-2">
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
                            className="rounded-lg border border-white/30 dark:border-white/20 bg-white/30 dark:bg-white/10 px-2 py-1.5 text-xs text-zinc-700 dark:text-white/80 outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
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
                                className="w-full rounded-lg border border-white/30 dark:border-white/20 bg-white/30 dark:bg-white/10 px-3 py-1.5 text-sm text-zinc-700 dark:text-white outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-zinc-400 dark:placeholder:text-white/40"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <main className="container mx-auto max-w-7xl">
                <div className="hidden sm:flex items-center border-b border-white/20 dark:border-white/15 px-4">
                    {(["collection", "following", "wishlist"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            aria-current={activeTab === tab ? "page" : undefined}
                            className={cn(
                                "px-4 py-3 text-[30px] font-medium transition-colors border-b-2 -mb-px",
                                activeTab === tab
                                    ? "border-violet-600 text-violet-600"
                                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white"
                            )}
                        >
                            {tab === "collection"
                                ? t.dashboard.tabCollection
                                : tab === "following"
                                ? t.dashboard.tabFollowing
                                : t.dashboard.tabWishlist}
                        </button>
                    ))}
                    <button
                        onClick={handleShareProfile}
                        className="ml-auto h-8 w-8 rounded-full flex items-center justify-center bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/30 dark:border-white/20 text-zinc-500 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white transition-colors"
                        title={t.dashboard.shareTitle}
                        aria-label={t.dashboard.shareTitle}
                    >
                        <Share2 className="h-4 w-4" />
                    </button>
                </div>

                {activeTab === "collection" && (
                    <WineGrid
                        wines={filteredWines}
                        onWineClick={(wine) => setSelectedWine(wine)}
                    />
                )}
                {activeTab === "following" && <FollowingFeed wines={feedWines} wishlistItems={wishlistItems} />}
                {activeTab === "wishlist" && <WishlistGrid items={wishlistItems} />}
            </main>

            {/* Add Picker Popup */}
            <AnimatePresence>
                {isPickerOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/10"
                            onClick={() => setIsPickerOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 8 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed bottom-48 sm:bottom-24 right-6 z-50 flex flex-col gap-2 items-end"
                        >
                            <PickerPill
                                emoji="🍷"
                                label={t.dashboard.addToCollection}
                                onClick={() => { setIsPickerOpen(false); setAddMode("collection"); }}
                            />
                            <PickerPill
                                emoji="🔖"
                                label={t.dashboard.addToWishlist}
                                onClick={() => { setIsPickerOpen(false); setAddMode("wishlist"); }}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Add Wine Modal */}
            <AnimatePresence>
                {addMode !== null && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
                            onClick={() => setAddMode(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-60 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="w-full max-w-sm pointer-events-auto relative max-h-[90vh] overflow-y-auto rounded-2xl">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute -top-12 right-0 text-white hover:bg-white/20 rounded-full"
                                    onClick={() => setAddMode(null)}
                                >
                                    <X className="h-6 w-6" />
                                </Button>
                                <WineForm mode={addMode} onSuccess={() => setAddMode(null)} />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Floating Add Button */}
            <button
                onClick={() => setIsPickerOpen((prev) => !prev)}
                aria-expanded={isPickerOpen}
                className="fixed bottom-32 sm:bottom-6 right-6 z-30 h-14 w-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-2xl font-light"
                title={t.dashboard.addWineTitle}
            >
                <motion.div
                    animate={{ rotate: isPickerOpen ? 45 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                    <Plus className="h-6 w-6" />
                </motion.div>
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

            {/* Mobile Bottom Nav */}
            <nav aria-label="Tab navigation" className="fixed bottom-4 left-4 right-20 z-20 flex sm:hidden items-center bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/30 dark:border-white/20 rounded-full shadow-[var(--glass-shadow)] h-14 overflow-hidden">
                {(["collection", "following", "wishlist"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        aria-current={activeTab === tab ? "page" : undefined}
                        className={cn(
                            "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-full text-xs font-medium transition-colors",
                            activeTab === tab
                                ? "bg-white/30 dark:bg-white/20 text-violet-600 dark:text-violet-400"
                                : "text-zinc-500"
                        )}
                    >
                        {tab === "collection" && <WineIcon className="h-5 w-5" aria-hidden="true" />}
                        {tab === "following" && <Users className="h-5 w-5" aria-hidden="true" />}
                        {tab === "wishlist" && <Bookmark className="h-5 w-5" aria-hidden="true" />}
                        <span>
                            {tab === "collection"
                                ? t.dashboard.tabCollection
                                : tab === "following"
                                ? t.dashboard.tabFollowing
                                : t.dashboard.tabWishlist}
                        </span>
                    </button>
                ))}
            </nav>

            {/* Mobile Share Button */}
            <button
                onClick={handleShareProfile}
                className="fixed bottom-4 right-4 z-30 flex sm:hidden h-14 w-14 rounded-full items-center justify-center bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/30 dark:border-white/20 shadow-[var(--glass-shadow)] text-zinc-500"
                title={t.dashboard.shareTitle}
                aria-label={t.dashboard.shareTitle}
            >
                <Share2 className="h-5 w-5" />
            </button>
        </div>
    );
}
