"use client";

import { useState } from "react";
import { Palette, ChevronDown, ChevronUp, Check, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import type { VideoTemplate } from "@/types/template";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TemplatesPanelProps {
  projectId: string;
}

export function TemplatesPanel({ projectId }: TemplatesPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const project = useStore((s) => s.getProject(projectId));
  const updateProject = useStore((s) => s.updateProject);
  const getAllTemplates = useStore((s) => s.getAllTemplates);
  const getTemplate = useStore((s) => s.getTemplate);
  const updateTemplate = useStore((s) => s.updateTemplate);
  const deleteTemplate = useStore((s) => s.deleteTemplate);

  if (!project) return null;

  const currentTemplate = getTemplate(project.templateId || "") || getAllTemplates()[0];
  const allTemplates = getAllTemplates();
  const isBuiltIn = (id: string) => id === "clean-minimal-cinematic";

  const handleApply = (template: VideoTemplate) => {
    updateProject(projectId, { templateId: template.id });
    toast.success(`Applied template: ${template.name}`);
  };

  const startRename = (template: VideoTemplate) => {
    setEditingId(template.id);
    setEditName(template.name);
  };

  const saveRename = (id: string) => {
    if (editName.trim()) {
      updateTemplate(id, { name: editName.trim() });
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (isBuiltIn(id)) return;
    deleteTemplate(id);
    if (project.templateId === id) {
      updateProject(projectId, { templateId: "clean-minimal-cinematic" });
    }
    toast.success("Template deleted");
  };

  return (
    <div className="flex flex-col border-t border-border">
      <button
        className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <Palette className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">Template</span>
        </div>
        {collapsed ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {/* Current template badge */}
          <div className="flex items-center gap-2 rounded-md bg-muted/50 border border-border px-3 py-2">
            <div className="flex gap-1">
              {currentTemplate.previewColors.slice(0, 4).map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-sm border border-white/10"
                  style={{ background: color }}
                />
              ))}
            </div>
            <span className="text-xs font-medium truncate flex-1">
              {currentTemplate.name}
            </span>
          </div>

          {/* Template list */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
              Available Templates
            </span>
            {allTemplates.map((template) => {
              const isActive = project.templateId === template.id;
              const isEditing = editingId === template.id;

              return (
                <div
                  key={template.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-md border px-2.5 py-2 transition-colors",
                    isActive
                      ? "border-primary/50 bg-primary/5"
                      : "border-border bg-transparent hover:bg-accent/30"
                  )}
                >
                  <div className="flex gap-0.5">
                    {template.previewColors.slice(0, 3).map((color, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-sm"
                        style={{ background: color }}
                      />
                    ))}
                  </div>

                  {isEditing ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(template.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onBlur={() => saveRename(template.id)}
                      className="h-6 text-xs flex-1"
                      autoFocus
                    />
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{template.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {template.description}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isEditing && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="h-6 w-6"
                          onClick={() => handleApply(template)}
                          title="Apply template"
                        >
                          <Check className={cn("h-3 w-3", isActive ? "text-primary" : "text-muted-foreground")} />
                        </Button>
                        {!isBuiltIn(template.id) && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="h-6 w-6"
                              onClick={() => startRename(template)}
                              title="Rename"
                            >
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(template.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
