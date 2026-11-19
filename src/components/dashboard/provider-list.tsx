"use client";

import { useState } from "react";
import { Plus, Server, Trash2, Star, Edit2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useProviderStore } from "@/lib/provider-store";
import { PROVIDER_LABELS } from "@/types/provider";
import { ProviderDialog } from "./provider-dialog";
import type { Provider } from "@/types/provider";

export function ProviderList() {
  const [open, setOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<Provider | null>(null);
  const providers = useProviderStore((s) => s.providers);
  const deleteProvider = useProviderStore((s) => s.deleteProvider);
  const setDefault = useProviderStore((s) => s.setDefault);

  const handleEdit = (provider: Provider) => {
    setEditProvider(provider);
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this provider?")) {
      deleteProvider(id);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="outline" size="sm">
              <Server className="h-4 w-4 mr-2" />
              Providers ({providers.length})
            </Button>
          }
        />
        <SheetContent className="w-[420px]">
          <SheetHeader>
            <SheetTitle>AI Providers</SheetTitle>
          </SheetHeader>

          <div className="mt-6 flex flex-col gap-4">
            <ProviderDialog
              trigger={
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Provider
                </Button>
              }
            />

            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="flex flex-col gap-2 pr-3">
                {providers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Server className="h-8 w-8 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No providers configured
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add a provider to start generating videos
                    </p>
                  </div>
                ) : (
                  providers.map((provider) => (
                    <div
                      key={provider.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Server className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {provider.name}
                          </p>
                          {provider.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {PROVIDER_LABELS[provider.type]}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {!provider.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDefault(provider.id)}
                            title="Set as default"
                          >
                            <Star className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(provider)}
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(provider.id)}
                          className="text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {editProvider && (
        <ProviderDialog
          provider={editProvider}
          open={!!editProvider}
          onOpenChange={(open) => !open && setEditProvider(null)}
        />
      )}
    </>
  );
}
