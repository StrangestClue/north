"use client";

import { useState, type ReactElement } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProviderStore } from "@/lib/provider-store";
import { PROVIDER_LABELS, PROVIDER_DEFAULTS } from "@/types/provider";
import type { Provider, ProviderType } from "@/types/provider";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface ProviderDialogProps {
  trigger?: ReactElement;
  provider?: Provider;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProviderDialog({
  trigger,
  provider,
  open: controlledOpen,
  onOpenChange,
}: ProviderDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [name, setName] = useState(provider?.name || "");
  const [type, setType] = useState<ProviderType>(provider?.type || "ollama");
  const [apiKey, setApiKey] = useState(provider?.apiKey || "");
  const [baseUrl, setBaseUrl] = useState(
    provider?.baseUrl || PROVIDER_DEFAULTS.ollama.baseUrl || ""
  );
  const [isDefault, setIsDefault] = useState(provider?.isDefault || false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const addProvider = useProviderStore((s) => s.addProvider);
  const updateProvider = useProviderStore((s) => s.updateProvider);

  const handleTypeChange = (newType: ProviderType) => {
    setType(newType);
    const defaults = PROVIDER_DEFAULTS[newType];
    setBaseUrl(defaults.baseUrl || "");
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const testProvider = {
        name: name.trim() || "test",
        type,
        apiKey: apiKey.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined,
      };

      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testProvider),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Connection failed");
      }

      const data = await res.json();
      if (data.models?.length > 0) {
        setTestResult("success");
        toast.success(`Connected! Found ${data.models.length} models`);
      } else {
        setTestResult("error");
        toast.error("Connected but no models found");
      }
    } catch (error) {
      setTestResult("error");
      toast.error(
        error instanceof Error ? error.message : "Connection failed"
      );
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Provider name is required");
      return;
    }

    const providerData = {
      name: name.trim(),
      type,
      apiKey: apiKey.trim() || undefined,
      baseUrl: baseUrl.trim() || undefined,
      isDefault,
    };

    if (provider) {
      updateProvider(provider.id, providerData);
      toast.success(`Updated ${name}`);
    } else {
      addProvider(providerData);
      toast.success(`Added ${name}`);
    }

    setOpen(false);
    if (!provider) {
      setName("");
      setApiKey("");
      setBaseUrl(PROVIDER_DEFAULTS[type].baseUrl || "");
      setIsDefault(false);
    }
  };

  const needsApiKey = type !== "ollama";
  const needsBaseUrl = type === "ollama" || type === "custom";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {provider ? "Edit Provider" : "Add Provider"}
          </DialogTitle>
          <DialogDescription>
            Configure an AI provider for script generation
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="My Ollama"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="type">Provider Type</Label>
            <Select value={type} onValueChange={(v) => handleTypeChange(v as ProviderType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROVIDER_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsBaseUrl && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                placeholder="http://localhost:11434"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
          )}

          {needsApiKey && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id="isDefault"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked === true)}
            />
            <Label htmlFor="isDefault" className="cursor-pointer">
              Set as default provider
            </Label>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testing}
              className="flex-1"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>
            {testResult === "success" && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {testResult === "error" && (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {provider ? "Update" : "Add"} Provider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
