"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/lib/store";
import { SceneItem } from "./scene-item";
import type { SceneType, SceneVisuals, TransitionType } from "@/types/project";

interface SceneDefaults {
  narration: string;
  duration: number | null;
  visuals: SceneVisuals;
  layers: [];
  transition_in: TransitionType;
  transition_out: TransitionType;
}

interface SceneListProps {
  projectId: string;
}

const SCENE_TYPES: { type: SceneType; label: string }[] = [
  { type: "title_card", label: "Title Card" },
  { type: "carousel", label: "Carousel" },
  { type: "diagram", label: "Diagram" },
  { type: "code_walkthrough", label: "Code" },
  { type: "text_overlay", label: "Text" },
  { type: "stock_footage", label: "Stock" },
  { type: "simulation_3d", label: "3D Sim" },
];

export function SceneList({ projectId }: SceneListProps) {
  const project = useStore((s) => s.getProject(projectId));
  const currentSceneId = useStore((s) => s.currentSceneId);
  const setCurrentScene = useStore((s) => s.setCurrentScene);
  const addScene = useStore((s) => s.addScene);

  if (!project) return null;

  const handleAddScene = (type: SceneType) => {
    const defaults: Record<SceneType, SceneDefaults> = {
      title_card: {
        narration: "",
        duration: null,
        visuals: { title: "Untitled", subtitle: "" },
        layers: [],
        transition_in: "fade_from_black",
        transition_out: "crossfade",
      },
      carousel: {
        narration: "",
        duration: null,
        visuals: { slides: [{ title: "Slide 1", bullets: ["Point 1"] }] },
        layers: [],
        transition_in: "crossfade",
        transition_out: "crossfade",
      },
      diagram: {
        narration: "",
        duration: null,
        visuals: { engine: "mermaid", source: "graph LR; A-->B" },
        layers: [],
        transition_in: "crossfade",
        transition_out: "crossfade",
      },
      code_walkthrough: {
        narration: "",
        duration: null,
        visuals: {
          engine: "code_highlight",
          language: "python",
          source: "",
        },
        layers: [],
        transition_in: "crossfade",
        transition_out: "crossfade",
      },
      simulation_3d: {
        narration: "",
        duration: null,
        visuals: { engine: "threejs", scene: "" },
        layers: [],
        transition_in: "crossfade",
        transition_out: "crossfade",
      },
      stock_footage: {
        narration: "",
        duration: null,
        visuals: { engine: "pexels", query: "" },
        layers: [],
        transition_in: "crossfade",
        transition_out: "crossfade",
      },
      text_overlay: {
        narration: "",
        duration: null,
        visuals: { text: "", style: "kinetic" },
        layers: [],
        transition_in: "crossfade",
        transition_out: "crossfade",
      },
    };

    addScene(projectId, { type, ...defaults[type] });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-medium">Scenes</h2>
        <div className="relative group">
          <Button variant="ghost" size="icon-xs">
            <Plus className="h-4 w-4" />
          </Button>
          <div className="absolute right-0 top-full z-50 mt-1 hidden w-44 rounded-md border border-border bg-popover p-1 shadow-md group-hover:block">
            {SCENE_TYPES.map(({ type, label }) => (
              <button
                key={type}
                className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                onClick={() => handleAddScene(type)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-2">
          {project.scenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <p className="text-sm text-muted-foreground">No scenes yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Hover the + button to add a scene
              </p>
            </div>
          ) : (
            project.scenes
              .sort((a, b) => a.order - b.order)
              .map((scene) => (
                <SceneItem
                  key={scene.id}
                  scene={scene}
                  isSelected={currentSceneId === scene.id}
                  onSelect={() => setCurrentScene(scene.id)}
                />
              ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
