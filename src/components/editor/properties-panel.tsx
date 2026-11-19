"use client";

import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Copy } from "lucide-react";
import { SCENE_TYPE_LABELS, TRANSITION_LABELS, LAYER_TYPE_LABELS } from "@/types/project";
import type {
  SceneType,
  TransitionType,
  Scene,
  Layer,
  TitleCardVisuals,
  CarouselVisuals,
  CodeWalkthroughVisuals,
  DiagramVisuals,
  TextOverlayVisuals,
  StockFootageVisuals,
} from "@/types/project";
import { toast } from "sonner";

interface PropertiesPanelProps {
  projectId: string;
}

// ─── VISUAL FIELD COMPONENTS ───────────────────────────────────

function TitleCardFields({ visuals, onChange }: { visuals: TitleCardVisuals; onChange: (v: TitleCardVisuals) => void }) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Title</Label>
        <Input value={visuals.title} onChange={(e) => onChange({ ...visuals, title: e.target.value })} placeholder="Main title" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Subtitle</Label>
        <Input value={visuals.subtitle || ""} onChange={(e) => onChange({ ...visuals, subtitle: e.target.value })} placeholder="Optional subtitle" />
      </div>
    </>
  );
}

function CarouselFields({ visuals, onChange }: { visuals: CarouselVisuals; onChange: (v: CarouselVisuals) => void }) {
  const slide = visuals.slides?.[0];
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs">Slides ({visuals.slides?.length || 0})</Label>
      {visuals.slides?.map((s, i) => (
        <div key={i} className="rounded-md border border-border p-2 space-y-2">
          <Input value={s.title} onChange={(e) => { const slides = [...visuals.slides]; slides[i] = { ...slides[i], title: e.target.value }; onChange({ ...visuals, slides }); }} placeholder={`Slide ${i + 1} title`} className="h-8 text-xs" />
          <Textarea value={s.bullets.join("\n")} onChange={(e) => { const slides = [...visuals.slides]; slides[i] = { ...slides[i], bullets: e.target.value.split("\n").filter(Boolean) }; onChange({ ...visuals, slides }); }} placeholder="One bullet per line" className="text-xs min-h-[60px]" />
        </div>
      ))}
    </div>
  );
}

function CodeFields({ visuals, onChange }: { visuals: CodeWalkthroughVisuals; onChange: (v: CodeWalkthroughVisuals) => void }) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Language</Label>
        <Input value={visuals.language} onChange={(e) => onChange({ ...visuals, language: e.target.value })} placeholder="python" className="h-8 text-xs" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Code</Label>
        <Textarea value={visuals.source} onChange={(e) => onChange({ ...visuals, source: e.target.value })} placeholder="Paste code here..." className="font-mono text-xs min-h-[120px]" />
      </div>
    </>
  );
}

function DiagramFields({ visuals, onChange }: { visuals: DiagramVisuals; onChange: (v: DiagramVisuals) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">Mermaid Source</Label>
      <Textarea value={visuals.source} onChange={(e) => onChange({ ...visuals, source: e.target.value })} placeholder="graph LR; A-->B; B-->C" className="font-mono text-xs min-h-[100px]" />
    </div>
  );
}

function TextOverlayFields({ visuals, onChange }: { visuals: TextOverlayVisuals; onChange: (v: TextOverlayVisuals) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">Text</Label>
      <Textarea value={visuals.text} onChange={(e) => onChange({ ...visuals, text: e.target.value })} placeholder="Overlay text" className="text-xs min-h-[80px]" />
    </div>
  );
}

function StockFootageFields({ visuals, onChange }: { visuals: StockFootageVisuals; onChange: (v: StockFootageVisuals) => void }) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Search Query</Label>
        <Input value={visuals.query} onChange={(e) => onChange({ ...visuals, query: e.target.value })} placeholder="e.g., data center servers" className="h-8 text-xs" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Overlay Text</Label>
        <Input value={visuals.overlay_text || ""} onChange={(e) => onChange({ ...visuals, overlay_text: e.target.value })} placeholder="Optional text overlay" className="h-8 text-xs" />
      </div>
    </>
  );
}

function SceneVisualFields({ scene, onUpdate }: { scene: Scene; onUpdate: (updates: Partial<Scene>) => void }) {
  switch (scene.type) {
    case "title_card":
      return <TitleCardFields visuals={scene.visuals as TitleCardVisuals} onChange={(v) => onUpdate({ visuals: v })} />;
    case "carousel":
      return <CarouselFields visuals={scene.visuals as CarouselVisuals} onChange={(v) => onUpdate({ visuals: v })} />;
    case "code_walkthrough":
      return <CodeFields visuals={scene.visuals as CodeWalkthroughVisuals} onChange={(v) => onUpdate({ visuals: v })} />;
    case "diagram":
      return <DiagramFields visuals={scene.visuals as DiagramVisuals} onChange={(v) => onUpdate({ visuals: v })} />;
    case "text_overlay":
      return <TextOverlayFields visuals={scene.visuals as TextOverlayVisuals} onChange={(v) => onUpdate({ visuals: v })} />;
    case "stock_footage":
      return <StockFootageFields visuals={scene.visuals as StockFootageVisuals} onChange={(v) => onUpdate({ visuals: v })} />;
    default:
      return <p className="text-xs text-muted-foreground">Visual editor for this scene type coming soon.</p>;
  }
}

// ─── LAYER VISUAL FIELDS ───────────────────────────────────────

function LayerVisualFields({ layer, onUpdate }: { layer: Layer; onUpdate: (updates: Partial<Layer>) => void }) {
  const v = layer.visuals;

  switch (v.kind) {
    case "text":
      return (
        <>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Text Content</Label>
            <Textarea value={v.text} onChange={(e) => onUpdate({ visuals: { ...v, text: e.target.value } })} placeholder="Text content..." className="text-xs min-h-[60px]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Align</Label>
              <Select value={v.align} onValueChange={(val) => onUpdate({ visuals: { ...v, align: val as "left" | "center" | "right" } })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Size</Label>
              <Select value={v.size || "md"} onValueChange={(val) => onUpdate({ visuals: { ...v, size: val as "sm" | "md" | "lg" | "xl" } })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="xl">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      );

    case "solid":
      return (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Color</Label>
          <Input value={v.color} onChange={(e) => onUpdate({ visuals: { ...v, color: e.target.value } })} placeholder="#050505" className="h-8 text-xs" />
        </div>
      );

    case "gradient":
      return (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">From</Label>
              <Input value={v.from} onChange={(e) => onUpdate({ visuals: { ...v, from: e.target.value } })} placeholder="#050505" className="h-8 text-xs" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">To</Label>
              <Input value={v.to} onChange={(e) => onUpdate({ visuals: { ...v, to: e.target.value } })} placeholder="#0a0a0a" className="h-8 text-xs" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Angle (degrees)</Label>
            <Input type="number" value={v.angle} onChange={(e) => onUpdate({ visuals: { ...v, angle: Number(e.target.value) } })} className="h-8 text-xs" />
          </div>
        </>
      );

    case "image":
      return (
        <>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Image URL</Label>
            <Input value={v.src} onChange={(e) => onUpdate({ visuals: { ...v, src: e.target.value } })} placeholder="https://..." className="h-8 text-xs" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Object Fit</Label>
            <Select value={v.objectFit} onValueChange={(val) => onUpdate({ visuals: { ...v, objectFit: val as "cover" | "contain" } })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">Cover</SelectItem>
                <SelectItem value="contain">Contain</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      );

    case "shape":
      return (
        <>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Shape</Label>
            <Select value={v.shape} onValueChange={(val) => onUpdate({ visuals: { ...v, shape: val as "line" | "circle" | "rect" } })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="rect">Rectangle</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Color</Label>
            <Input value={v.color} onChange={(e) => onUpdate({ visuals: { ...v, color: e.target.value } })} placeholder="#fafafa" className="h-8 text-xs" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Opacity</Label>
              <Input type="number" step={0.1} min={0} max={1} value={v.opacity} onChange={(e) => onUpdate({ visuals: { ...v, opacity: Number(e.target.value) } })} className="h-8 text-xs" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Width</Label>
              <Input type="number" value={v.width || 100} onChange={(e) => onUpdate({ visuals: { ...v, width: Number(e.target.value) } })} className="h-8 text-xs" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Height</Label>
              <Input type="number" value={v.height || 100} onChange={(e) => onUpdate({ visuals: { ...v, height: Number(e.target.value) } })} className="h-8 text-xs" />
            </div>
          </div>
        </>
      );

    case "code":
      return (
        <>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Language</Label>
            <Input value={v.language} onChange={(e) => onUpdate({ visuals: { ...v, language: e.target.value } })} placeholder="python" className="h-8 text-xs" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Source</Label>
            <Textarea value={v.source} onChange={(e) => onUpdate({ visuals: { ...v, source: e.target.value } })} placeholder="print('hello')" className="font-mono text-xs min-h-[100px]" />
          </div>
        </>
      );

    case "diagram":
      return (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Mermaid Source</Label>
          <Textarea value={v.source} onChange={(e) => onUpdate({ visuals: { ...v, source: e.target.value } })} placeholder="graph LR\n  A-->B" className="font-mono text-xs min-h-[100px]" />
        </div>
      );

    case "carousel":
      return (
        <div className="flex flex-col gap-2">
          <Label className="text-xs">Slides</Label>
          {v.slides.map((slide, i) => (
            <div key={i} className="rounded-md border border-border p-2 space-y-2">
              <Input value={slide.title} onChange={(e) => { const slides = [...v.slides]; slides[i] = { ...slides[i], title: e.target.value }; onUpdate({ visuals: { ...v, slides } }); }} placeholder="Slide title" className="h-8 text-xs" />
              <Textarea value={slide.bullets.join("\n")} onChange={(e) => { const slides = [...v.slides]; slides[i] = { ...slides[i], bullets: e.target.value.split("\n").filter(Boolean) }; onUpdate({ visuals: { ...v, slides } }); }} placeholder="Bullets (one per line)" className="text-xs min-h-[50px]" />
            </div>
          ))}
        </div>
      );

    case "caption":
      return <p className="text-xs text-muted-foreground">Captions are generated automatically from narration.</p>;

    default:
      return <p className="text-xs text-muted-foreground">No editable properties for this layer type.</p>;
  }
}

// ─── MAIN PROPERTIES PANEL ─────────────────────────────────────

export function PropertiesPanel({ projectId }: PropertiesPanelProps) {
  const project = useStore((s) => s.getProject(projectId));
  const currentSceneId = useStore((s) => s.currentSceneId);
  const currentLayerId = useStore((s) => s.currentLayerId);
  const updateScene = useStore((s) => s.updateScene);
  const updateLayer = useStore((s) => s.updateLayer);
  const addLayer = useStore((s) => s.addLayer);
  const deleteLayer = useStore((s) => s.deleteLayer);

  const scene = project?.scenes.find((s) => s.id === currentSceneId);
  const layer = scene?.layers.find((l) => l.id === currentLayerId);

  if (!scene) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">Select a scene</p>
      </div>
    );
  }

  const handleSceneUpdate = (updates: Partial<Scene>) => {
    updateScene(projectId, scene.id, updates);
  };

  const handleLayerUpdate = (updates: Partial<Layer>) => {
    if (!layer) return;
    updateLayer(projectId, scene.id, layer.id, updates);
  };

  const handleDuplicateLayer = () => {
    if (!layer) return;
    addLayer(projectId, scene.id, {
      name: `${layer.name} (Copy)`,
      type: layer.type,
      zIndex: layer.zIndex + 1,
      startTime: layer.startTime,
      duration: layer.duration,
      visuals: JSON.parse(JSON.stringify(layer.visuals)),
    });
    toast.success("Layer duplicated");
  };

  const handleDeleteLayer = () => {
    if (!layer) return;
    deleteLayer(projectId, scene.id, layer.id);
    toast.success("Layer deleted");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden border-b border-border">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-medium">Properties</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {layer ? `${layer.name} &middot; ${LAYER_TYPE_LABELS[layer.type]} Layer` : `${SCENE_TYPE_LABELS[scene.type]} &middot; Scene ${scene.order + 1}`}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {layer ? (
            // ─── LAYER PROPERTIES ────────────────────────────
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Layer Name</Label>
                <Input value={layer.name} onChange={(e) => handleLayerUpdate({ name: e.target.value })} placeholder="Layer name" className="h-8 text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Start Time (s)</Label>
                  <Input type="number" step={0.1} value={layer.startTime} onChange={(e) => handleLayerUpdate({ startTime: Number(e.target.value) })} className="h-8 text-xs" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Duration (s)</Label>
                  <Input type="number" step={0.1} value={layer.duration} onChange={(e) => handleLayerUpdate({ duration: Number(e.target.value) })} className="h-8 text-xs" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Z-Index</Label>
                <Input type="number" value={layer.zIndex} onChange={(e) => handleLayerUpdate({ zIndex: Number(e.target.value) })} className="h-8 text-xs" />
              </div>

              <Separator />

              <div>
                <Label className="text-xs font-medium mb-3 block">Visuals</Label>
                <div className="flex flex-col gap-3">
                  <LayerVisualFields layer={layer} onUpdate={handleLayerUpdate} />
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={handleDuplicateLayer}>
                  <Copy className="h-3 w-3 mr-1" />
                  Duplicate
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs h-8 text-destructive hover:text-destructive" onClick={handleDeleteLayer}>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </>
          ) : (
            // ─── SCENE PROPERTIES ────────────────────────────
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Narration</Label>
                <Textarea
                  value={scene.narration}
                  onChange={(e) => handleSceneUpdate({ narration: e.target.value })}
                  placeholder="What the narrator says for this scene..."
                  className="text-xs min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Duration (s)</Label>
                  <Input
                    type="number"
                    value={scene.duration ?? ""}
                    onChange={(e) => handleSceneUpdate({ duration: e.target.value ? Number(e.target.value) : null })}
                    placeholder="Auto"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Scene Type</Label>
                  <Select value={scene.type} onValueChange={(v) => handleSceneUpdate({ type: v as SceneType })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(SCENE_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Transition In</Label>
                  <Select value={scene.transition_in} onValueChange={(v) => handleSceneUpdate({ transition_in: v as TransitionType })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TRANSITION_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Transition Out</Label>
                  <Select value={scene.transition_out} onValueChange={(v) => handleSceneUpdate({ transition_out: v as TransitionType })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TRANSITION_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-xs font-medium">Scene Visuals</Label>
                </div>
                <div className="flex flex-col gap-3">
                  <SceneVisualFields scene={scene} onUpdate={handleSceneUpdate} />
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-xs font-medium">Layers ({scene.layers.length})</Label>
                </div>
                <div className="flex flex-col gap-1.5">
                  {scene.layers.sort((a, b) => a.zIndex - b.zIndex).map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        useStore.getState().setCurrentScene(scene.id);
                        useStore.getState().setCurrentLayer(l.id);
                      }}
                      className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-left hover:bg-accent/30 transition-colors"
                    >
                      <span className="text-[10px] text-muted-foreground w-4 text-center">{l.zIndex}</span>
                      <span className="text-xs truncate flex-1">{l.name}</span>
                      <span className="text-[10px] text-muted-foreground">{LAYER_TYPE_LABELS[l.type]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
