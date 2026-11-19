"use client";

import {
  Type,
  LayoutList,
  Network,
  Code,
  Box,
  Video,
  AlignCenter,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { SCENE_TYPE_LABELS } from "@/types/project";
import type { Scene, SceneType } from "@/types/project";
import { cn } from "@/lib/utils";

const SCENE_ICONS: Record<SceneType, React.ElementType> = {
  title_card: Type,
  carousel: LayoutList,
  diagram: Network,
  code_walkthrough: Code,
  simulation_3d: Box,
  stock_footage: Video,
  text_overlay: AlignCenter,
};

interface SceneItemProps {
  scene: Scene;
  isSelected: boolean;
  onSelect: () => void;
}

export function SceneItem({ scene, isSelected, onSelect }: SceneItemProps) {
  const Icon = SCENE_ICONS[scene.type];
  const deleteScene = useStore((s) => s.deleteScene);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const projectId = useStore.getState().currentProjectId;
    if (projectId) deleteScene(projectId, scene.id);
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-2.5 rounded-md px-3 py-2.5 transition-colors cursor-pointer",
        isSelected
          ? "bg-accent border border-accent-foreground/10"
          : "hover:bg-accent/50 border border-transparent"
      )}
      onClick={onSelect}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded",
          isSelected ? "bg-primary/10" : "bg-muted"
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium truncate">
            {SCENE_TYPE_LABELS[scene.type]}
          </p>
          {scene.duration && scene.duration > 0 && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">
              {Math.round(scene.duration)}s
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">
          {scene.narration ? scene.narration.substring(0, 60) + (scene.narration.length > 60 ? "..." : "") : "No narration"}
        </p>
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className="text-[10px]">{scene.order + 1}</span>
        <Button
          variant="ghost"
          size="icon-xs"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
