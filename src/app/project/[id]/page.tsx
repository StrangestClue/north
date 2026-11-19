"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Download, Loader2 } from "lucide-react";
import { Header } from "@/components/shared/header";
import { EditorLayout } from "@/components/editor/editor-layout";
import { ModelSelector } from "@/components/editor/model-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";
import { useProviderStore } from "@/lib/provider-store";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  generating: "bg-blue-500/10 text-blue-400",
  complete: "bg-green-500/10 text-green-400",
  error: "bg-destructive/10 text-destructive",
};

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const project = useStore((s) => s.getProject(projectId));
  const updateProject = useStore((s) => s.updateProject);
  const getDefaultProvider = useProviderStore((s) => s.getDefaultProvider);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const [generatedVideoPath, setGeneratedVideoPath] = useState<string | null>(null);

  const startProgressStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`/api/progress/${projectId}`);
    eventSourceRef.current = es;

    es.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "progress") {
          setProgress(data.progress || 0);
          setProgressMessage(data.message || "");

          if (data.status === "complete") {
            updateProject(projectId, { status: "complete" });
            setIsGenerating(false);
            es.close();
            toast.success(data.message);
            setGeneratedVideoPath(`/output/${projectId}.mp4`);
          } else if (data.status === "error") {
            updateProject(projectId, { status: "error" });
            setIsGenerating(false);
            es.close();
            toast.error(data.message || "Generation failed");
          }
        }
      } catch {}
    });

    es.onerror = () => {
      es.close();
    };
  };

  if (!project) {
    return (
      <>
        <Header showBack />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Project not found</p>
        </main>
      </>
    );
  }

  const defaultProvider = getDefaultProvider();

  const handleExport = async () => {
    if (!defaultProvider || !project.selectedModel) {
      toast.error("Please select a model for this project");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setProgressMessage("Starting...");
    updateProject(projectId, { status: "generating" });

    startProgressStream();

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project,
          provider: defaultProvider,
          model: project.selectedModel,
        }),
      });

      const data = await response.json();

      if (!response.ok && !data.partial) {
        throw new Error(data.error || "Generation failed");
      }

      // Save generated scenes to project (even for partial results)
      if (data.scenes && data.scenes.length > 0) {
        updateProject(projectId, { scenes: data.scenes });
      }

      if (data.partial) {
        // Rendering failed but scenes were saved
        updateProject(projectId, { status: "draft" });
        setIsGenerating(false);
        toast.warning(
          `Scenes saved (${data.scenesCount} scenes), but video rendering failed: ${data.error}. You can retry export.`,
          { duration: 8000 }
        );
        return;
      }

      setGeneratedVideoPath(`/output/${projectId}.mp4`);
    } catch (error) {
      updateProject(projectId, { status: "error" });
      setIsGenerating(false);
      toast.error(
        error instanceof Error ? error.message : "Generation failed"
      );
    }
  };

  const handleModelChange = (model: string) => {
    updateProject(projectId, { selectedModel: model });
  };

  return (
    <>
      <Header showBack title={project.title}>
        <Badge
          variant="secondary"
          className={STATUS_COLORS[project.status]}
        >
          {project.status}
        </Badge>
        <ModelSelector
          selectedModel={project.selectedModel}
          onSelect={handleModelChange}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          disabled={isGenerating || !project.selectedModel}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export
            </>
          )}
        </Button>
      </Header>

      {isGenerating && (
        <div className="border-b border-border bg-background px-6 py-3">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {progressMessage}
              </span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>
      )}

      {generatedVideoPath && !isGenerating && (
        <div className="border-b border-border bg-background px-6 py-4">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Generated Video</h3>
              <a
                href={generatedVideoPath}
                download={`${project.title.replace(/\s+/g, "-").toLowerCase()}.mp4`}
                className="text-xs text-primary hover:underline"
              >
                Download MP4
              </a>
            </div>
            <div className="aspect-video rounded-lg overflow-hidden bg-zinc-950 border border-border">
              <video
                src={generatedVideoPath}
                controls
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}

      <EditorLayout projectId={projectId} />
    </>
  );
}
