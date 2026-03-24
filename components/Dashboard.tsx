"use client";

import * as React from "react";
import { Wine, User } from "@prisma/client";
import { Plus, X, LogOut, Search } from "lucide-react";
import { WineGrid } from "@/components/WineGrid";
import { WineModal } from "@/components/WineModal";
import { WineForm } from "@/components/WineForm";
import { Button } from "@/components/ui/Button";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { logout } from "@/app/auth-actions";

interface DashboardProps {
    wines: Wine[];
    user: User;
}

export function Dashboard({ wines, user }: DashboardProps) {
    const [isAddOpen, setIsAddOpen] = React.useState(false);
    const [selectedWine, setSelectedWine] = React.useState<Wine | null>(null);
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    const filteredWines = searchQuery.trim()
        ? wines.filter((w) =>
              w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              w.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : wines;

    const handleSearchToggle = () => {
        if (isSearchOpen) {
            setIsSearchOpen(false);
            setSearchQuery("");
        } else {
            setIsSearchOpen(true);
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                            VinoVault
                        </h1>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400 hidden sm:inline-block">
                            Welcome, {user.username}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            onClick={handleSearchToggle}
                            title="Search"
                        >
                            {isSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                        </Button>
                        <Button
                            onClick={() => setIsAddOpen(true)}
                            size="sm"
                            className="rounded-full"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Wine
                        </Button>
                        <form action={logout}>
                            <Button variant="ghost" size="icon" className="rounded-full" title="Logout">
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
                                placeholder="Search wines..."
                                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <main className="container mx-auto max-w-7xl">
                <WineGrid
                    wines={filteredWines}
                    onWineClick={(wine) => setSelectedWine(wine)}
                />
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

            {/* Wine Details Modal */}
            <AnimatePresence>
                {selectedWine && (
                    <WineModal
                        wine={selectedWine}
                        onClose={() => setSelectedWine(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
