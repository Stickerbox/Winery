import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import { RatingStar } from "@/components/ui/RatingStar";
import { getCurrentUser } from "@/app/auth-actions";
import { addSharedWine } from "@/app/actions";

const prisma = new PrismaClient();

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;

    const [wine, user] = await Promise.all([
        prisma.wine.findUnique({
            where: { shareToken: token },
            include: { user: true },
        }),
        getCurrentUser(),
    ]);

    if (!wine) notFound();

    const isOwnWine = user?.id === wine.userId;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <img
                        src={wine.imagePath}
                        alt={wine.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h1 className="font-bold text-xl leading-tight">{wine.name}</h1>
                        <p className="text-sm text-white/70 mt-0.5">Shared by {wine.user.username}</p>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    <RatingStar rating={wine.rating} readonly className="gap-1" />

                    <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                        {wine.description}
                    </p>

                    <p className="text-xs text-zinc-400">
                        Added {new Date(wine.createdAt).toLocaleDateString()}
                    </p>
                </div>

                <div className="px-5 pb-5">
                    {isOwnWine ? (
                        <a
                            href="/"
                            className="block w-full text-center text-sm font-medium py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 transition-opacity"
                        >
                            View your collection
                        </a>
                    ) : user ? (
                        <form action={addSharedWine.bind(null, token)}>
                            <button
                                type="submit"
                                className="w-full text-center text-sm font-medium py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 transition-opacity"
                            >
                                Add to my wines
                            </button>
                        </form>
                    ) : (
                        <a
                            href={`/login?redirect=/share/${token}`}
                            className="block w-full text-center text-sm font-medium py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 transition-opacity"
                        >
                            Log in to add to your wines
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
