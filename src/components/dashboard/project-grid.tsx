"use client";

import { Plus, Film } from "lucide-react";
import { useStore } from "@/lib/store";
import { ProjectCard } from "./project-card";
import { CreateProjectDialog } from "./create-project-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export function ProjectGrid() {
  const projects = useStore((s) => s.projects);

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<Film className="h-8 w-8 text-muted-foreground" />}
        title="No projects yet"
        description="Create your first video project to get started with North."
      >
        <CreateProjectDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </CreateProjectDialog>
      </EmptyState>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
    </div>
  );
}
