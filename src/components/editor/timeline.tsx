"use client";

import { useState } from "react";
import {
  Type,
  LayoutList,
  Network,
  Code,
  Box,
  Video,
  AlignCenter,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { SCENE_TYPE_LABELS } from "@/types/project";
import type { SceneType } from "@/types/project";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayeredTimeline } from "./layered-timeline";

const SCENE_ICONS: Record<SceneType, React.ElementType> = {
  title_card: Type,
  carousel: LayoutList,
  diagram: Network,
  code_walkthrough: Code,
  simulation_3d: Box,
  stock_footage: Video,
  text_overlay: AlignCenter,
};

interface TimelineProps {
  projectId: string;
}

export function Timeline({ projectId }: TimelineProps) {
  const project = useStore((s) => s.getProject(projectId));
  const currentSceneId = useStore((s) => s.currentSceneId);
  const setCurrentScene = useStore((s) => s.setCurrentScene);
  const [showPreview, setShowPreview] = useState(false);

  if (!project || project.scenes.length === 0) {
    return (
      <div className="h-20 flex items-center justify-center">
        <p className="text-xs text-muted-foreground">
          Add scenes to see the timeline
        </p>
      </div>
    );
  }

  const totalDuration = project.scenes.reduce(
    (sum, s) => sum + (s.duration || 5),
    0
  );

  const videoPath = project.status === "complete" ? `/output/${projectId}.mp4` : null;

  return (
    <div className="flex flex-col h-full">
      {videoPath && (
        <div className="border-b border-border px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-muted-foreground">Video Preview</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="h-6 text-xs"
            >
              {showPreview ? "Hide" : "Show"} Preview
            </Button>
          </div>
          {showPreview && (
            <div className="aspect-video max-h-[200px] rounded-lg overflow-hidden bg-zinc-950 border border-border">
              <video
                src={videoPath}
                controls
                className="w-full h-full"
              />
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <LayeredTimeline projectId={projectId} />
      </div>
    </div>
  );
}
