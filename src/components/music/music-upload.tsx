"use client";

import { useState, useCallback } from "react";
import { Upload, Music } from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import type { MusicTrack } from "@/types/project";
import { cn } from "@/lib/utils";

export function MusicUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const addMusicTrack = useStore((s) => s.addMusicTrack);

  const uploadFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/music", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Upload failed");
        }

        const track: MusicTrack = await res.json();
        addMusicTrack(track);
        toast.success(`Uploaded "${track.originalName}"`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Upload failed"
        );
      } finally {
        setIsUploading(false);
      }
    },
    [addMusicTrack]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      files.forEach(uploadFile);
    },
    [uploadFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      files.forEach(uploadFile);
      e.target.value = "";
    },
    [uploadFile]
  );

  return (
    <label
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground/50",
        isUploading && "opacity-50 pointer-events-none"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {isUploading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
          <p className="text-sm text-muted-foreground">Uploading...</p>
        </div>
      ) : (
        <>
          <div className="rounded-full bg-muted p-3">
            {isDragging ? (
              <Music className="h-5 w-5 text-primary" />
            ) : (
              <Upload className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              {isDragging ? "Drop files here" : "Drop audio files here"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              MP3, WAV, OGG, FLAC, M4A
            </p>
          </div>
        </>
      )}
      <input
        type="file"
        className="sr-only"
        accept=".mp3,.wav,.ogg,.flac,.m4a"
        multiple
        onChange={handleFileInput}
      />
    </label>
  );
}
