"use client";

import { useState, useEffect, useRef } from "react";
import { Brain, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProviderStore } from "@/lib/provider-store";
import { toast } from "sonner";

interface ModelSelectorProps {
  selectedModel: string | null;
  onSelect: (model: string) => void;
}

export function ModelSelector({ selectedModel, onSelect }: ModelSelectorProps) {
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const defaultProvider = useProviderStore((s) => s.getDefaultProvider);
  const fetchModelsRef = useRef<() => Promise<void>>(async () => {});

  const fetchModels = async () => {
    const provider = defaultProvider();
    if (!provider) return;

    setLoading(true);
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(provider),
      });

      if (!res.ok) throw new Error("Failed to fetch models");

      const data = await res.json();
      setModels(data.models || []);
    } catch {
      toast.error("Failed to fetch models");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelsRef.current = fetchModels;
  }, []);

  useEffect(() => {
    if (defaultProvider()) {
      fetchModelsRef.current();
    }
  }, [defaultProvider]);

  if (!defaultProvider()) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="No provider configured" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select
      value={selectedModel || ""}
      onValueChange={(v) => v && onSelect(v)}
    >
      <SelectTrigger className="w-[200px]">
        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
          <SelectValue placeholder="Select model" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model} value={model}>
            {model}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
