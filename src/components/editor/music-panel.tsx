"use client";

import { useState } from "react";
import { Music, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore } from "@/lib/store";
import { MusicSelector } from "@/components/music/music-selector";
import type { MusicTrack } from "@/types/project";

interface MusicPanelProps {
  projectId: string;
}

export function MusicPanel({ projectId }: MusicPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const project = useStore((s) => s.getProject(projectId));
  const setBackgroundMusic = useStore((s) => s.setBackgroundMusic);
  const getMusicTrack = useStore((s) => s.getMusicTrack);

  if (!project) return null;

  const music = project.backgroundMusic;
  const track = music ? getMusicTrack(music.trackId) : null;

  const handleSelectTrack = (t: MusicTrack) => {
    setBackgroundMusic(projectId, {
      trackId: t.id,
      volume: music?.volume ?? 0.15,
      ducking: music?.ducking ?? true,
      duckingRatio: music?.duckingRatio ?? 0.1,
      normalRatio: music?.normalRatio ?? 0.3,
    });
  };

  const handleRemove = () => {
    setBackgroundMusic(projectId, null);
  };

  return (
    <div className="flex flex-col">
      <button
        className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <Music className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">Background Music</span>
        </div>
        {collapsed ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          <MusicSelector
            selectedTrackId={music?.trackId || null}
            onSelect={handleSelectTrack}
          />

          {track && (
            <>
              <audio
                src={`/api/music/${track.id}/stream`}
                controls
                className="w-full h-8"
                preload="none"
              />

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Volume</Label>
                  <span className="text-xs text-muted-foreground">
                    {Math.round((music?.volume ?? 0.15) * 100)}%
                  </span>
                </div>
                <Slider
                  value={[music?.volume ?? 0.15]}
                  onValueChange={(val) => {
                    const v = Array.isArray(val) ? val[0] : val;
                    setBackgroundMusic(projectId, {
                      ...music!,
                      volume: v,
                    });
                  }}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="ducking"
                  checked={music?.ducking ?? true}
                  onCheckedChange={(checked) =>
                    setBackgroundMusic(projectId, {
                      ...music!,
                      ducking: checked === true,
                    })
                  }
                />
                <Label htmlFor="ducking" className="text-xs cursor-pointer">
                  Smart Ducking
                </Label>
              </div>

              {music?.ducking && (
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div className="flex flex-col gap-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Active
                    </Label>
                    <span className="text-xs">
                      {Math.round((music?.duckingRatio ?? 0.1) * 100)}%
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Silence
                    </Label>
                    <span className="text-xs">
                      {Math.round((music?.normalRatio ?? 0.3) * 100)}%
                    </span>
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-destructive hover:text-destructive h-7"
                onClick={handleRemove}
              >
                <X className="h-3 w-3 mr-1" />
                Remove Music
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
