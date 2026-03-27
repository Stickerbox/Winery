"use client";

import * as React from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { RatingStar } from "@/components/ui/RatingStar";
import { Card, CardContent } from "@/components/ui/Card";
import imageCompression from "browser-image-compression";
import { addWine, analyzeWineImage, addToWishlistManual } from "@/app/actions";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "@/components/LanguageContext";

type Phase = "capture" | "analyzing" | "review";

interface WineFormProps {
    onSuccess?: () => void;
    initialValues?: { name: string; description: string };
    skipAnalysis?: boolean;
    onSubmit?: (formData: FormData) => Promise<void>;
    mode?: "collection" | "wishlist";
}

export function WineForm({ onSuccess, initialValues, skipAnalysis, onSubmit, mode = "collection" }: WineFormProps) {
    const [isPending, startTransition] = React.useTransition();
    const [phase, setPhase] = React.useState<Phase>(initialValues ? "review" : "capture");
    const [rating, setRating] = React.useState(0);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [name, setName] = React.useState(initialValues?.name ?? "");
    const [description, setDescription] = React.useState(initialValues?.description ?? "");
    const [notes, setNotes] = React.useState("");
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const compressedFileRef = React.useRef<File | null>(null);
    const { t } = useTranslations();
    const analyzingText = React.useRef<string>("");

    const startAnalyzing = () => {
        const messages = t.wineForm.analyzing;
        analyzingText.current = messages[Math.floor(Math.random() * messages.length)];
        setPhase("analyzing");
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const compressed = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
        });
        compressedFileRef.current = new File([compressed], file.name, { type: compressed.type });

        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(compressed);

        const dt = new DataTransfer();
        dt.items.add(compressedFileRef.current);
        e.target.files = dt.files;

        if (skipAnalysis) {
            setPhase("review");
        } else {
            startAnalyzing();
            try {
                const fd = new FormData();
                fd.append("image", compressedFileRef.current);
                const result = await analyzeWineImage(fd);
                setName(result.name);
                setDescription(result.description);
            } catch (err) {
                console.error("Wine analysis failed:", err);
            } finally {
                setPhase("review");
            }
        }
    };

    const handleSubmit = async (formData: FormData) => {
        if (!compressedFileRef.current) {
            alert(t.wineForm.imageRequired);
            return;
        }
        if (mode !== "wishlist" && rating === 0) {
            alert(t.wineForm.ratingRequired);
            return;
        }
        if (mode !== "wishlist") {
            formData.set("rating", rating.toString());
        }

        startTransition(async () => {
            try {
                if (onSubmit) {
                    await onSubmit(formData);
                } else if (mode === "wishlist") {
                    await addToWishlistManual(formData);
                } else {
                    await addWine(formData);
                }
                setRating(0);
                setImagePreview(null);
                setName(initialValues?.name ?? "");
                setDescription(initialValues?.description ?? "");
                setNotes("");
                setPhase(initialValues ? "review" : "capture");
                compressedFileRef.current = null;
                if (fileInputRef.current) fileInputRef.current.value = "";
                onSuccess?.();
            } catch (error) {
                console.error(error);
                alert(mode === "wishlist" ? t.wineForm.saveFailedWishlist : t.wineForm.saveFailed);
            }
        });
    };

    return (
        <Card className="w-full max-w-sm mx-auto overflow-hidden">
            <CardContent className="p-4">
                <form action={handleSubmit} className="space-y-4">
                    <motion.div
                        animate={{ height: !imagePreview ? 240 : 144 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={cn(
                            "relative w-full overflow-hidden rounded-xl",
                            !imagePreview && "border-2 border-dashed border-white/40 dark:border-white/35 bg-white/20 dark:bg-white/25 hover:bg-white/30 dark:hover:bg-white/35 transition-colors flex items-center justify-center cursor-pointer"
                        )}
                        onClick={() => !imagePreview && fileInputRef.current?.click()}
                    >
                        {imagePreview ? (
                            <>
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                                {phase === "analyzing" && (
                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
                                        <div className="h-7 w-7 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                        <p className="text-white text-sm font-medium tracking-wide">{analyzingText.current}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-zinc-400">
                                <Camera className="h-12 w-12" />
                                <span className="text-sm font-medium">{t.wineForm.takePhoto}</span>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            name="image"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                        />
                    </motion.div>

                    <AnimatePresence>
                        {phase === "review" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
                                className="space-y-3"
                            >
                                <div className="space-y-1">
                                    <label className="text-sm font-medium leading-none">{t.wineForm.nameLabel}</label>
                                    <Input
                                        name="name"
                                        placeholder={t.wineForm.namePlaceholder}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium leading-none">{t.wineForm.descriptionLabel}</label>
                                    <Textarea
                                        name="description"
                                        placeholder={t.wineForm.descriptionPlaceholder}
                                        className="min-h-[60px]"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                    />
                                </div>

                                {mode !== "wishlist" && (
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium leading-none">{t.wineForm.ratingLabel}</label>
                                        <div className="flex justify-center py-1">
                                            <RatingStar rating={rating} onRatingChange={setRating} className="gap-2" />
                                        </div>
                                    </div>
                                )}

                                {mode !== "wishlist" && (
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium leading-none">{t.wineForm.notesLabel}</label>
                                        <Textarea
                                            name="notes"
                                            placeholder={t.wineForm.notesPlaceholder}
                                            className="min-h-[60px]"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={
                                        isPending ||
                                        !compressedFileRef.current ||
                                        !name.trim() ||
                                        !description.trim() ||
                                        (mode !== "wishlist" && rating === 0)
                                    }
                                >
                                    {mode === "wishlist"
                                        ? isPending ? t.wineForm.savingWishlist : t.wineForm.saveWishlist
                                        : isPending ? t.wineForm.saving : t.wineForm.save}
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </CardContent>
        </Card>
    );
}
