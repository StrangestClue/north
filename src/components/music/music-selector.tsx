"use client";

import { Music, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { MusicLibrary } from "./music-library";
import type { MusicTrack } from "@/types/project";

interface MusicSelectorProps {
  selectedTrackId: string | null;
  onSelect: (track: MusicTrack) => void;
}

export function MusicSelector({
  selectedTrackId,
  onSelect,
}: MusicSelectorProps) {
  const getMusicTrack = useStore((s) => s.getMusicTrack);
  const selectedTrack = selectedTrackId
    ? getMusicTrack(selectedTrackId)
    : null;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        className="flex-1 justify-between font-normal"
        disabled
      >
        <span className="flex items-center gap-2 truncate">
          <Music className="h-4 w-4 shrink-0 text-muted-foreground" />
          {selectedTrack ? (
            <span className="truncate">{selectedTrack.originalName}</span>
          ) : (
            <span className="text-muted-foreground">Select a track...</span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Button>

      <MusicLibrary onSelect={onSelect} selectedTrackId={selectedTrackId || undefined} />
    </div>
  );
}
