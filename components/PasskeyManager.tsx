"use client";

import { useState, useTransition } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { removePasskey } from "@/app/auth-actions";
import { useTranslations } from "@/components/LanguageContext";
import { cn } from "@/lib/utils";

interface Passkey {
  id: string;
  transports: string | null;
  createdAt: Date;
}

interface PasskeyManagerProps {
  passkeys: Passkey[];
  username: string;
}

export function PasskeyManager({ passkeys: initial, username }: PasskeyManagerProps) {
  const { t } = useTranslations();
  const [passkeys, setPasskeys] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [addStatus, setAddStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleAddPasskey() {
    setError(null);
    const optionsRes = await fetch("/api/auth/passkeys/add/options", {
      method: "POST",
    });

    if (!optionsRes.ok) {
      setError(t.security.passkeyError);
      return;
    }

    const options = await optionsRes.json();
    setAddStatus(t.security.adding);

    let credential;
    try {
      credential = await startRegistration({ optionsJSON: options });
    } catch (e: unknown) {
      setAddStatus(null);
      const name = e instanceof Error ? e.name : '';
      const message = e instanceof Error ? e.message : String(e);
      setError(name === 'NotAllowedError' ? t.security.passkeyCancelled : message);
      return;
    }

    const verifyRes = await fetch("/api/auth/register/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, credential }),
    });

    setAddStatus(null);
    if (verifyRes.ok) {
      window.location.reload();
    } else {
      setError(t.security.passkeyError);
    }
  }

  function handleRemove(id: string) {
    if (passkeys.length <= 1) {
      setError(t.security.removeError);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await removePasskey(id);
        setPasskeys((prev) => prev.filter((p) => p.id !== id));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t.security.passkeyError);
      }
    });
  }

  return (
    <Card className="bg-white/35 dark:bg-white/20 backdrop-blur-xl border border-white/40 dark:border-white/25">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <KeyRound className="w-4 h-4" />
          {t.security.passkeys}
        </CardTitle>
        <Button
          onClick={handleAddPasskey}
          disabled={!!addStatus}
          className="h-8 px-3 text-sm"
        >
          <Plus className="w-3 h-3 mr-1" />
          {addStatus ?? t.security.addPasskey}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {passkeys.length === 0 ? (
          <p className="text-sm text-zinc-500">{t.security.noPasskeys}</p>
        ) : (
          passkeys.map((pk) => {
            const transports: string[] = JSON.parse(pk.transports ?? "[]");
            const label = transports.includes("internal")
              ? "Device passkey"
              : transports.includes("hybrid")
              ? "Cross-device passkey"
              : "Passkey";
            const dateStr = new Date(pk.createdAt).toLocaleDateString();

            return (
              <div
                key={pk.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/20 dark:bg-white/10"
              >
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-zinc-500">
                    {t.security.addedOn.replace("{date}", dateStr)}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(pk.id)}
                  disabled={isPending || passkeys.length <= 1}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    passkeys.length <= 1
                      ? "text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
                      : "text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  )}
                  aria-label={t.security.remove}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
