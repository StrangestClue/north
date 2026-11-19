"use client";

import Link from "next/link";
import { Film, Trash2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import type { Project } from "@/types/project";

const STATUS_COLORS: Record<Project["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  generating: "bg-blue-500/10 text-blue-400",
  complete: "bg-green-500/10 text-green-400",
  error: "bg-destructive/10 text-destructive",
};

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const deleteProject = useStore((s) => s.deleteProject);

  return (
    <Link href={`/project/${project.id}`}>
      <Card className="group relative transition-colors hover:bg-accent/50 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                <Film className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base leading-tight">
                  {project.title}
                </CardTitle>
                <CardDescription className="mt-1">
                  {new Date(project.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </CardDescription>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteProject(project.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={STATUS_COLORS[project.status]}
            >
              {project.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {project.scenes.length} scene{project.scenes.length !== 1 ? "s" : ""}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
