import { headers } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { RatingStar } from "@/components/ui/RatingStar";
import { getCurrentUser } from "@/app/auth-actions";
import { addSharedWine } from "@/app/actions";
import { getT, detectServerLang } from "@/lib/i18n";

const prisma = new PrismaClient();

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const lang = detectServerLang((await headers()).get("accept-language"));

    const [wine, user] = await Promise.all([
        prisma.wine.findUnique({
            where: { shareToken: token },
            include: { user: true },
        }),
        getCurrentUser(),
    ]);

    if (!wine) notFound();

    const t = getT(lang);
    const isOwnWine = user?.id === wine.userId;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
            <div className="w-full max-w-sm bg-white/65 dark:bg-white/15 backdrop-blur-lg border border-white/50 dark:border-white/20 rounded-2xl overflow-hidden shadow-[var(--glass-shadow)]">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/10">
                    <Image
                        src={wine.imagePath}
                        alt={wine.name}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h1 className="font-bold text-xl leading-tight">{wine.name}</h1>
                        <p className="text-sm text-white/70 mt-0.5">
                            {t.share.sharedBy.replace("{username}", wine.user.username)}
                        </p>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    <RatingStar rating={wine.rating} readonly className="gap-1" />

                    <p className="text-zinc-700 dark:text-white/80 text-sm leading-relaxed">
                        {wine.description}
                    </p>

                    <p className="text-xs text-zinc-400 dark:text-white/40">
                        {t.share.added.replace("{date}", new Date(wine.createdAt).toLocaleDateString())}
                    </p>
                </div>

                <div className="px-5 pb-5">
                    {isOwnWine ? (
                        <Link
                            href="/"
                            className="block w-full text-center text-sm font-medium py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 transition-opacity"
                        >
                            {t.share.viewCollection}
                        </Link>
                    ) : user ? (
                        <form action={addSharedWine.bind(null, token)}>
                            <button
                                type="submit"
                                className="w-full text-center text-sm font-medium py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 transition-opacity"
                            >
                                {t.share.addToMine}
                            </button>
                        </form>
                    ) : (
                        <a
                            href={`/login?redirect=/share/${token}`}
                            className="block w-full text-center text-sm font-medium py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 transition-opacity"
                        >
                            {t.share.loginToAdd}
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
