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
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 gap-4">
            <Card className="w-full max-w-md border-0 shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800">
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
                                className="h-12 text-lg"
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
