"use client";

import * as React from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { RatingStar } from "@/components/ui/RatingStar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import imageCompression from "browser-image-compression";
import { addWine } from "@/app/actions";
import { cn } from "@/lib/utils";

export function WineForm({ onSuccess }: { onSuccess?: () => void }) {
    const [isPending, startTransition] = React.useTransition();
    const [rating, setRating] = React.useState(0);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const compressed = await imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1200,
                useWebWorker: true,
            });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(compressed);
            // Replace the file in the input with the compressed version
            const dt = new DataTransfer();
            dt.items.add(new File([compressed], file.name, { type: compressed.type }));
            e.target.files = dt.files;
        }
    };

    const handleSubmit = async (formData: FormData) => {
        if (rating === 0) {
            alert("Please select a rating");
            return;
        }
        formData.set("rating", rating.toString());

        startTransition(async () => {
            try {
                await addWine(formData);
                // Reset form
                setRating(0);
                setImagePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                onSuccess?.();
            } catch (error) {
                console.error(error);
                alert("Failed to add wine");
            }
        });
    };

    return (
        <Card className="w-full max-w-sm mx-auto overflow-hidden border-0 shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-800">
            <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 py-3 pb-3">
                <CardTitle className="text-lg text-center">Add New Wine</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <form action={handleSubmit} className="space-y-4">
                    {/* Image Upload */}
                    <div className="space-y-2">
                        <div
                            className={cn(
                                "relative h-36 w-full overflow-hidden rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800",
                                imagePreview && "border-solid border-0 p-0"
                            )}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {imagePreview ? (
                                <>
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <Camera className="h-8 w-8 text-white" />
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-zinc-500">
                                    <Camera className="h-10 w-10" />
                                    <span className="text-sm font-medium">Take Photo or Upload</span>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                name="image"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleImageChange}
                                required
                            />
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Name
                            </label>
                            <Input name="name" placeholder="e.g. Château Margaux" required />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Description
                            </label>
                            <Textarea
                                name="description"
                                placeholder="Tasting notes, vintage, etc."
                                className="min-h-[60px]"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Rating
                            </label>
                            <div className="flex justify-center py-1">
                                <RatingStar rating={rating} onRatingChange={setRating} className="gap-2" />
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isPending}
                    >
                        {isPending ? "Adding Wine..." : "Save to Collection"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
