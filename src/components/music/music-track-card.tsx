"use client";

import { useState, useRef } from "react";
import { Play, Pause, Trash2, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import type { MusicTrack } from "@/types/project";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface MusicTrackCardProps {
  track: MusicTrack;
  onSelect?: (track: MusicTrack) => void;
  isSelected?: boolean;
}

export function MusicTrackCard({
  track,
  onSelect,
  isSelected,
}: MusicTrackCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const removeMusicTrack = useStore((s) => s.removeMusicTrack);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/music/${track.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      removeMusicTrack(track.id);
      toast.success(`Removed "${track.originalName}"`);
    } catch {
      toast.error("Failed to delete track");
    }
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
        onSelect ? "cursor-pointer hover:bg-accent" : ""
      } ${isSelected ? "border-primary bg-primary/5" : "border-border"}`}
      onClick={() => onSelect?.(track)}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
        <Music className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{track.originalName}</p>
        <p className="text-xs text-muted-foreground">
          {track.duration > 0 ? formatDuration(track.duration) : "--:--"} ·{" "}
          {formatSize(track.size)}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleDelete}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <audio
        ref={audioRef}
        src={`/api/music/${track.id}/stream`}
        onEnded={() => setIsPlaying(false)}
        preload="none"
      />
    </div>
  );
}
