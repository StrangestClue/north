"use client";

import { useState, useEffect, useRef } from "react";
import { Video, Loader2, ExternalLink } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface StockProvider {
  id: string;
  name: string;
  type: "pexels" | "pixabay";
  apiKey: string;
  baseUrl?: string;
  enabled: boolean;
}

export function StockFootageConfig() {
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<StockProvider[]>([
    {
      id: "pexels",
      name: "Pexels",
      type: "pexels",
      apiKey: "",
      baseUrl: "https://api.pexels.com",
      enabled: false,
    },
    {
      id: "pixabay",
      name: "Pixabay",
      type: "pixabay",
      apiKey: "",
      baseUrl: "https://pixabay.com/api",
      enabled: false,
    },
  ]);
  const [testing, setTesting] = useState<string | null>(null);
  const loadProvidersRef = useRef<() => Promise<void>>(async () => {});

  const loadProviders = async () => {
    try {
      const res = await fetch("/api/stock/config");
      if (res.ok) {
        const saved = await res.json();
        if (saved && saved.length > 0) {
          setProviders(saved);
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadProvidersRef.current = loadProviders;
  }, []);

  useEffect(() => {
    if (open) {
      loadProvidersRef.current();
    }
  }, [open]);

  const saveProviders = async (newProviders: StockProvider[]) => {
    setProviders(newProviders);
    try {
      await fetch("/api/stock/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProviders),
      });
    } catch (error) {
      console.error("Failed to save stock providers:", error);
    }
  };

  const handleApiKeyChange = (id: string, apiKey: string) => {
    const updated = providers.map((p) =>
      p.id === id ? { ...p, apiKey, enabled: apiKey.length > 0 } : p
    );
    saveProviders(updated);
  };

  const handleTestConnection = async (provider: StockProvider) => {
    if (!provider.apiKey) {
      toast.error("Please enter an API key first");
      return;
    }

    setTesting(provider.id);
    try {
      const res = await fetch("/api/stock/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(provider),
      });

      if (!res.ok) {
        throw new Error("Connection failed");
      }

      const data = await res.json();
      if (data.success) {
        toast.success(`${provider.name} connection successful!`);
      } else {
        throw new Error(data.error || "Connection failed");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Connection failed"
      );
    } finally {
      setTesting(null);
    }
  };

  const getApiKeyUrl = (type: string) => {
    switch (type) {
      case "pexels":
        return "https://www.pexels.com/api/";
      case "pixabay":
        return "https://pixabay.com/api/docs/";
      default:
        return "#";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="ghost" size="icon-sm" title="Stock Footage Settings">
          <Video className="h-4 w-4" />
        </Button>
      } />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Stock Footage & Images</DialogTitle>
          <DialogDescription>
            Configure API keys for stock footage providers. These will be used to fetch relevant clips and images for your video scenes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="flex flex-col gap-2 rounded-lg border border-border p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{provider.name}</span>
                </div>
                {provider.enabled && provider.apiKey ? (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-400">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary">Not configured</Badge>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Enter API key"
                    value={provider.apiKey}
                    onChange={(e) =>
                      handleApiKeyChange(provider.id, e.target.value)
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection(provider)}
                    disabled={testing === provider.id || !provider.apiKey}
                  >
                    {testing === provider.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Test"
                    )}
                  </Button>
                </div>
                <a
                  href={getApiKeyUrl(provider.type)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                >
                  Get API key <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
