"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { detectClientLang, getT } from "@/lib/i18n";

export default function LoginPage() {
    const router = useRouter();
    const t = getT(detectClientLang());

    const [username, setUsername] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!window.PublicKeyCredential) {
            setError(t.login.notSupported);
            return;
        }

        // Try register first — server returns 409 if user already has credentials
        const optionsRes = await fetch("/api/auth/register/options", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
        });

        if (optionsRes.status === 409) {
            await authenticate();
        } else if (optionsRes.ok) {
            const options = (await optionsRes.json()) as PublicKeyCredentialCreationOptionsJSON;
            await register(options);
        } else {
            const body = await optionsRes.json();
            setError(body.error ?? t.login.error);
        }
    }

    async function register(options: PublicKeyCredentialCreationOptionsJSON) {
        setStatus(t.login.registering);
        let credential;
        try {
            credential = await startRegistration({ optionsJSON: options });
        } catch {
            setStatus(null);
            setError(t.login.cancelled);
            return;
        }

        const verifyRes = await fetch("/api/auth/register/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, credential }),
        });

        setStatus(null);
        if (verifyRes.ok) {
            const { redirectTo } = await verifyRes.json();
            router.push(redirectTo);
        } else {
            setError(t.login.error);
        }
    }

    async function authenticate() {
        const optionsRes = await fetch("/api/auth/authenticate/options", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
        });

        if (!optionsRes.ok) {
            setError(t.login.error);
            return;
        }

        const options = await optionsRes.json();
        setStatus(t.login.authenticating);

        let credential;
        try {
            credential = await startAuthentication({ optionsJSON: options });
        } catch {
            setStatus(null);
            setError(t.login.cancelled);
            return;
        }

        const verifyRes = await fetch("/api/auth/authenticate/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credential),
        });

        setStatus(null);
        if (verifyRes.ok) {
            const { redirectTo } = await verifyRes.json();
            router.push(redirectTo);
        } else {
            setError(t.login.error);
        }
    }

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
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={t.login.usernamePlaceholder}
                                required
                                className="h-12 text-lg bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 placeholder:text-zinc-400 dark:placeholder:text-white/40"
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}
                        <Button
                            type="submit"
                            className="w-full h-12 text-lg"
                            disabled={!!status}
                        >
                            {status ?? t.login.submit}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
