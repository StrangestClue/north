"use client";

import { useStore } from "@/lib/store";
import { SCENE_TYPE_LABELS } from "@/types/project";
import type { Scene, TitleCardVisuals, CarouselVisuals, CodeWalkthroughVisuals, DiagramVisuals, TextOverlayVisuals, StockFootageVisuals } from "@/types/project";

interface PreviewCanvasProps {
  projectId: string;
}

function TitleCardPreview({ visuals }: { visuals: TitleCardVisuals }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="w-12 h-0.5 bg-gradient-to-r from-white to-zinc-600 rounded-full" />
      <h1 className="text-3xl font-bold tracking-tight text-center px-8" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
        {visuals.title || "Title"}
      </h1>
      {visuals.subtitle && (
        <p className="text-lg text-zinc-400 text-center px-8">
          {visuals.subtitle}
        </p>
      )}
    </div>
  );
}

function CarouselPreview({ visuals }: { visuals: CarouselVisuals }) {
  const slide = visuals.slides?.[0];
  return (
    <div className="flex flex-col items-start justify-center h-full px-12 gap-6">
      {slide && (
        <>
          <div className="w-10 h-0.5 bg-gradient-to-r from-white to-zinc-600 rounded-full" />
          <h2 className="text-2xl font-semibold tracking-tight">{slide.title}</h2>
          <ul className="space-y-3">
            {slide.bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-zinc-300 shrink-0" />
                <span className="text-base text-zinc-300">{bullet}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function CodePreview({ visuals }: { visuals: CodeWalkthroughVisuals }) {
  return (
    <div className="flex flex-col items-start justify-start h-full p-6">
      <div className="w-full rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border-b border-zinc-800">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="ml-2 text-[10px] text-zinc-500 font-mono">{visuals.language || "code"}</span>
        </div>
        <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap p-4 leading-relaxed">
          {visuals.source || "// No code yet"}
        </pre>
      </div>
    </div>
  );
}

function DiagramPreview({ visuals }: { visuals: DiagramVisuals }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 gap-3">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-5 py-4 max-w-sm">
        <code className="text-[10px] font-mono text-zinc-500 leading-relaxed whitespace-pre-wrap">
          {visuals.source}
        </code>
      </div>
      <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Mermaid Diagram</p>
    </div>
  );
}

function TextOverlayPreview({ visuals }: { visuals: TextOverlayVisuals }) {
  return (
    <div className="flex items-center justify-center h-full px-12">
      <p className="text-2xl font-bold text-left leading-snug" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
        {visuals.text || "Text overlay"}
      </p>
    </div>
  );
}

function StockFootagePreview({ visuals }: { visuals: StockFootageVisuals }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      {visuals.mediaUrl ? (
        <img src={visuals.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950" />
      )}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 px-4 py-2">
          <p className="text-xs text-zinc-400">
            Search: &quot;{visuals.query || "..."}&quot;
          </p>
        </div>
        {visuals.overlay_text && (
          <p className="text-lg font-semibold text-white drop-shadow-lg">{visuals.overlay_text}</p>
        )}
      </div>
    </div>
  );
}

function ScenePreview({ scene }: { scene: Scene }) {
  switch (scene.type) {
    case "title_card":
      return <TitleCardPreview visuals={scene.visuals as TitleCardVisuals} />;
    case "carousel":
      return <CarouselPreview visuals={scene.visuals as CarouselVisuals} />;
    case "code_walkthrough":
      return <CodePreview visuals={scene.visuals as CodeWalkthroughVisuals} />;
    case "diagram":
      return <DiagramPreview visuals={scene.visuals as DiagramVisuals} />;
    case "text_overlay":
      return <TextOverlayPreview visuals={scene.visuals as TextOverlayVisuals} />;
    case "stock_footage":
      return <StockFootagePreview visuals={scene.visuals as StockFootageVisuals} />;
    default:
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">
            {SCENE_TYPE_LABELS[scene.type]} preview
          </p>
        </div>
      );
  }
}

export function PreviewCanvas({ projectId }: PreviewCanvasProps) {
  const project = useStore((s) => s.getProject(projectId));
  const currentSceneId = useStore((s) => s.currentSceneId);
  const currentScene = project?.scenes.find((s) => s.id === currentSceneId);

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-3xl aspect-video rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden relative shadow-2xl">
          {currentScene ? (
            <ScenePreview scene={currentScene} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <p className="text-sm text-zinc-600">
                Select a scene to preview
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
