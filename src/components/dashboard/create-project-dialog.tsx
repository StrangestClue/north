"use client";

import { useState, useEffect, useRef, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Palette } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { useProviderStore } from "@/lib/provider-store";
import { MusicSelector } from "@/components/music/music-selector";
import type { MusicTrack } from "@/types/project";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CreateProjectDialog({ children }: { children?: ReactElement }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("clean-minimal-cinematic");
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const createProject = useStore((s) => s.createProject);
  const getAllTemplates = useStore((s) => s.getAllTemplates);
  const getDefaultProvider = useProviderStore((s) => s.getDefaultProvider);
  const router = useRouter();
  const fetchModelsRef = useRef<() => Promise<void>>(async () => {});

  const templates = getAllTemplates();

  const fetchModels = async () => {
    const provider = getDefaultProvider();
    if (!provider) return;

    setLoadingModels(true);
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(provider),
      });

      if (!res.ok) throw new Error("Failed to fetch models");

      const data = await res.json();
      setModels(data.models || []);
      if (data.models?.length > 0) {
        setSelectedModel(data.models[0]);
      }
    } catch {
      toast.error("Failed to fetch models from provider");
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    fetchModelsRef.current = fetchModels;
  }, []);

  useEffect(() => {
    if (open) {
      fetchModelsRef.current();
    }
  }, [open]);

  const handleCreate = () => {
    if (!title.trim()) return;
    if (!selectedModel) {
      toast.error("Please select a model");
      return;
    }
    const id = createProject(title.trim(), {
      musicTrackId: selectedTrackId || undefined,
      selectedModel,
      templateId: selectedTemplateId,
    });
    setOpen(false);
    setTitle("");
    setSelectedTrackId(null);
    setSelectedModel("");
    setSelectedTemplateId("clean-minimal-cinematic");
    router.push(`/project/${id}`);
  };

  const handleSelectTrack = (track: MusicTrack) => {
    setSelectedTrackId(track.id);
  };

  const defaultProvider = getDefaultProvider();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          children || (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Enter a title and select a model for your video project.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., How Transformers Work"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Model</Label>
            {loadingModels ? (
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-transparent text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading models...
              </div>
            ) : !defaultProvider ? (
              <div className="h-10 flex items-center px-3 rounded-md border border-input bg-transparent text-sm text-muted-foreground">
                No default provider configured
              </div>
            ) : models.length === 0 ? (
              <div className="h-10 flex items-center px-3 rounded-md border border-input bg-transparent text-sm text-muted-foreground">
                No models available
              </div>
            ) : (
              <Select value={selectedModel} onValueChange={(v) => v && setSelectedModel(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Background Music (optional)</Label>
            <MusicSelector
              selectedTrackId={selectedTrackId}
              onSelect={handleSelectTrack}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5" />
              Video Template
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={cn(
                    "flex flex-col gap-1.5 rounded-md border p-2.5 text-left transition-colors",
                    selectedTemplateId === template.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent/30"
                  )}
                >
                  <div className="flex gap-1">
                    {template.previewColors.slice(0, 4).map((color, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-sm border border-white/10"
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{template.name}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || !selectedModel || loadingModels}
          >
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
