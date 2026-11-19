"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useStore } from "@/lib/store";
import { SceneList } from "./scene-list";
import { PreviewCanvas } from "./preview-canvas";
import { PropertiesPanel } from "./properties-panel";
import { Timeline } from "./timeline";
import { TemplatesPanel } from "./templates-panel";
import { MusicPanel } from "./music-panel";
import { AIAssistant } from "./ai-assistant";

interface EditorLayoutProps {
  projectId: string;
}

export function EditorLayout({ projectId }: EditorLayoutProps) {
  const project = useStore((s) => s.getProject(projectId));
  const [timelineHeight, setTimelineHeight] = useState(200);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResize = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResize = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;
      setTimelineHeight(Math.max(120, Math.min(500, newHeight)));
    },
    []
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResize);
      return () => {
        window.removeEventListener("mousemove", resize);
        window.removeEventListener("mouseup", stopResize);
      };
    }
  }, [isResizing, resize, stopResize]);

  if (!project) return null;

  return (
    <div ref={containerRef} className="flex flex-1 flex-col overflow-hidden">
      <div className="grid flex-1 grid-cols-[280px_1fr_320px] gap-px bg-border overflow-hidden">
        <div className="bg-background overflow-hidden flex flex-col">
          <SceneList projectId={projectId} />
        </div>

        <div className="bg-background overflow-hidden flex flex-col">
          <PreviewCanvas projectId={projectId} />
        </div>

        <div className="bg-background overflow-hidden flex flex-col">
          <PropertiesPanel projectId={projectId} />
          <TemplatesPanel projectId={projectId} />
          <MusicPanel projectId={projectId} />
        </div>
      </div>

      {/* Resizable timeline area */}
      <div 
        className="relative flex flex-col bg-background border-t border-border"
        style={{ height: timelineHeight }}
      >
        {/* Drag handle */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5 cursor-row-resize hover:bg-primary/50 transition-colors z-10 flex items-center justify-center"
          onMouseDown={startResize}
        >
          <div className="w-8 h-0.5 rounded-full bg-border hover:bg-primary/80" />
        </div>
        <div className="flex-1 overflow-hidden pt-1.5">
          <Timeline projectId={projectId} />
        </div>
      </div>

      <AIAssistant projectId={projectId} />
    </div>
  );
}
