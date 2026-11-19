"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Type,
  LayoutList,
  Network,
  Code,
  Box,
  Video,
  AlignCenter,
  ChevronDown,
  ChevronRight,
  Layers,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { SCENE_TYPE_LABELS, LAYER_TYPE_LABELS } from "@/types/project";
import type { SceneType, LayerType } from "@/types/project";
import { cn } from "@/lib/utils";

const PIXELS_PER_SECOND = 20;
const LAYER_HEIGHT = 28;
const SCENE_HEADER_HEIGHT = 32;

const SCENE_ICONS: Record<SceneType, React.ElementType> = {
  title_card: Type,
  carousel: LayoutList,
  diagram: Network,
  code_walkthrough: Code,
  simulation_3d: Box,
  stock_footage: Video,
  text_overlay: AlignCenter,
};

const LAYER_COLORS: Record<LayerType, { bg: string; border: string; text: string }> = {
  background: { bg: "bg-zinc-800", border: "border-zinc-700", text: "text-zinc-400" },
  content: { bg: "bg-emerald-900/40", border: "border-emerald-800", text: "text-emerald-400" },
  caption: { bg: "bg-amber-900/40", border: "border-amber-800", text: "text-amber-400" },
  overlay: { bg: "bg-purple-900/40", border: "border-purple-800", text: "text-purple-400" },
  media: { bg: "bg-rose-900/40", border: "border-rose-800", text: "text-rose-400" },
};

interface LayeredTimelineProps {
  projectId: string;
}

export function LayeredTimeline({ projectId }: LayeredTimelineProps) {
  const project = useStore((s) => s.getProject(projectId));
  const currentSceneId = useStore((s) => s.currentSceneId);
  const currentLayerId = useStore((s) => s.currentLayerId);
  const setCurrentScene = useStore((s) => s.setCurrentScene);
  const setCurrentLayer = useStore((s) => s.setCurrentLayer);
  const updateLayer = useStore((s) => s.updateLayer);

  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());
  const [dragState, setDragState] = useState<{
    sceneId: string;
    layerId: string;
    startX: number;
    initialStartTime: number;
  } | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);

  if (!project || project.scenes.length === 0) {
    return (
      <div className="h-20 flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Add scenes to see the timeline</p>
      </div>
    );
  }

  const sortedScenes = [...project.scenes].sort((a, b) => a.order - b.order);
  const totalDuration = sortedScenes.reduce((sum, s) => sum + (s.duration || 5), 0);
  const totalWidth = Math.max(totalDuration * PIXELS_PER_SECOND, 800);

  const toggleScene = (sceneId: string) => {
    setExpandedScenes((prev) => {
      const next = new Set(prev);
      if (next.has(sceneId)) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });
  };

  const handleLayerClick = (sceneId: string, layerId: string) => {
    setCurrentScene(sceneId);
    setCurrentLayer(layerId);
  };

  const handleMouseDown = (
    e: React.MouseEvent,
    sceneId: string,
    layerId: string,
    startTime: number
  ) => {
    e.stopPropagation();
    setDragState({
      sceneId,
      layerId,
      startX: e.clientX,
      initialStartTime: startTime,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState) return;
      const deltaPixels = e.clientX - dragState.startX;
      const deltaSeconds = deltaPixels / PIXELS_PER_SECOND;
      const newStartTime = Math.max(0, dragState.initialStartTime + deltaSeconds);
      updateLayer(projectId, dragState.sceneId, dragState.layerId, { startTime: newStartTime });
    },
    [dragState, projectId, updateLayer]
  );

  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  useEffect(() => {
    if (dragState) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  // Time ruler
  const rulerSeconds = Math.ceil(totalDuration);
  const rulerTicks = Array.from({ length: rulerSeconds + 1 }, (_, i) => i);

  return (
    <div className="flex flex-col h-full">
      {/* Video preview (if complete) */}
      {project.status === "complete" && (
        <div className="border-b border-border px-4 py-2 flex items-center justify-between">
          <h3 className="text-xs font-medium text-muted-foreground">Video Preview</h3>
          <span className="text-xs text-muted-foreground">
            {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, "0")} total
          </span>
        </div>
      )}

      {/* Timeline content */}
      <div ref={timelineRef} className="flex-1 overflow-auto">
        <div style={{ width: totalWidth + 200, minWidth: "100%" }}>
          {/* Time ruler */}
          <div className="flex items-end h-8 border-b border-border sticky top-0 bg-background z-10">
            <div className="w-[180px] shrink-0 border-r border-border px-3 py-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Timeline</span>
            </div>
            <div className="flex-1 relative h-full">
              {rulerTicks.map((sec) => (
                <div
                  key={sec}
                  className="absolute bottom-0 flex flex-col items-center"
                  style={{ left: sec * PIXELS_PER_SECOND }}
                >
                  <span className="text-[9px] text-muted-foreground mb-0.5">{sec}s</span>
                  <div className="w-px h-2 bg-border" />
                </div>
              ))}
            </div>
          </div>

          {/* Scene rows */}
          {sortedScenes.map((scene) => {
            const sceneDuration = scene.duration || 5;
            const sceneWidth = sceneDuration * PIXELS_PER_SECOND;
            const isExpanded = expandedScenes.has(scene.id);
            const isSelected = currentSceneId === scene.id;
            const Icon = SCENE_ICONS[scene.type];

            return (
              <div
                key={scene.id}
                className={cn(
                  "border-b border-border",
                  isSelected && "bg-accent/20"
                )}
              >
                {/* Scene header */}
                <button
                  className="flex items-center w-full hover:bg-accent/30 transition-colors"
                  onClick={() => {
                    setCurrentScene(scene.id);
                    toggleScene(scene.id);
                  }}
                >
                  <div className="w-[180px] shrink-0 flex items-center gap-2 px-3 py-1.5 border-r border-border">
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                    <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[11px] font-medium truncate">
                      {SCENE_TYPE_LABELS[scene.type]}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                      {Math.round(sceneDuration)}s
                    </span>
                  </div>

                  {/* Scene block in timeline */}
                  <div className="flex-1 relative py-1">
                    <div
                      className={cn(
                        "h-5 rounded-sm border flex items-center px-1.5 transition-colors",
                        isSelected
                          ? "border-primary/50 bg-primary/10"
                          : "border-border bg-muted/30"
                      )}
                      style={{ width: sceneWidth }}
                    >
                      <span className="text-[9px] text-muted-foreground truncate">
                        {scene.narration ? scene.narration.substring(0, 30) + "..." : "No narration"}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Layer sub-tracks */}
                {isExpanded && (
                  <div className="flex flex-col">
                    {scene.layers
                      .sort((a, b) => a.zIndex - b.zIndex)
                      .map((layer) => {
                        const layerDuration = layer.duration > 0 ? layer.duration : sceneDuration;
                        const layerWidth = layerDuration * PIXELS_PER_SECOND;
                        const layerLeft = layer.startTime * PIXELS_PER_SECOND;
                        const isLayerSelected = currentLayerId === layer.id;
                        const colors = LAYER_COLORS[layer.type];

                        return (
                          <div
                            key={layer.id}
                            className="flex items-center hover:bg-accent/10"
                          >
                            <div className="w-[180px] shrink-0 flex items-center gap-2 px-3 py-0.5 border-r border-border">
                              <Layers className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                              <span className="text-[10px] text-muted-foreground truncate">
                                {layer.name || LAYER_TYPE_LABELS[layer.type]}
                              </span>
                            </div>

                            <div className="flex-1 relative py-0.5" style={{ height: LAYER_HEIGHT }}>
                              <div
                                className={cn(
                                  "absolute top-0.5 h-[calc(100%-4px)] rounded-sm border cursor-pointer transition-all hover:brightness-110 select-none",
                                  colors.bg,
                                  colors.border,
                                  isLayerSelected && "ring-1 ring-primary ring-offset-1"
                                )}
                                style={{
                                  left: layerLeft,
                                  width: Math.max(layerWidth, 20),
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLayerClick(scene.id, layer.id);
                                }}
                                onMouseDown={(e) => handleMouseDown(e, scene.id, layer.id, layer.startTime)}
                              >
                                <span className={cn("text-[9px] px-1 truncate block leading-[22px]", colors.text)}>
                                  {layer.name || LAYER_TYPE_LABELS[layer.type]}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
