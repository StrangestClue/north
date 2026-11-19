"use client";

import { useState } from "react";
import { Music } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/lib/store";
import { MusicUpload } from "./music-upload";
import { MusicTrackCard } from "./music-track-card";
import type { MusicTrack } from "@/types/project";

interface MusicLibraryProps {
  onSelect?: (track: MusicTrack) => void;
  selectedTrackId?: string;
}

export function MusicLibrary({ onSelect, selectedTrackId }: MusicLibraryProps) {
  const [open, setOpen] = useState(false);
  const musicTracks = useStore((s) => s.musicTracks);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon-sm">
            <Music className="h-4 w-4" />
          </Button>
        }
      />
      <SheetContent className="w-[380px] sm:w-[420px]">
        <SheetHeader>
          <SheetTitle>Music Library</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-4">
          <MusicUpload />

          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="flex flex-col gap-2 pr-3">
              {musicTracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Music className="h-8 w-8 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No tracks yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload audio files to use as background music
                  </p>
                </div>
              ) : (
                musicTracks.map((track) => (
                  <MusicTrackCard
                    key={track.id}
                    track={track}
                    onSelect={
                      onSelect
                        ? (t) => {
                            onSelect(t);
                            setOpen(false);
                          }
                        : undefined
                    }
                    isSelected={selectedTrackId === track.id}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
