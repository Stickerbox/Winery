import { headers } from "next/headers";
import { login } from "@/app/auth-actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { getT, detectServerLang } from "@/lib/i18n";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
    const { redirect } = await searchParams;
    const loginWithRedirect = login.bind(null, redirect ?? "/");
    const lang = detectServerLang((await headers()).get("accept-language"));
    const t = getT(lang);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
            <Card className="w-full max-w-md bg-white/35 dark:bg-white/20 backdrop-blur-xl border border-white/40 dark:border-white/25">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                        VinoVault
                    </CardTitle>
                    <CardDescription>
                        {t.login.description}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={loginWithRedirect} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                name="username"
                                placeholder={t.login.usernamePlaceholder}
                                required
                                className="h-12 text-lg bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 placeholder:text-zinc-400 dark:placeholder:text-white/40"
                            />
                        </div>
                        <Button type="submit" className="w-full h-12 text-lg">
                            {t.login.submit}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
