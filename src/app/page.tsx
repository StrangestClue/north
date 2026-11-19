"use client";

import { Plus } from "lucide-react";
import { Header } from "@/components/shared/header";
import { ProjectGrid } from "@/components/dashboard/project-grid";
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";
import { ProviderList } from "@/components/dashboard/provider-list";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <>
      <Header>
        <ProviderList />
        <CreateProjectDialog>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </CreateProjectDialog>
      </Header>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <ProjectGrid />
        </div>
      </main>
    </>
  );
}
