import { NextRequest, NextResponse } from "next/server";
import { runPipeline, type PipelineResult } from "@/lib/pipeline/orchestrator";
import { runPreflight } from "@/lib/pipeline/preflight";
import { publish } from "@/lib/progress";

export async function POST(request: NextRequest) {
  let projectId: string | null = null;

  try {
    const { project, provider, model } = await request.json();

    if (!project || !project.id) {
      return NextResponse.json(
        { error: "Valid project data required" },
        { status: 400 }
      );
    }

    projectId = project.id;

    if (!provider || !model) {
      return NextResponse.json(
        { error: "Provider and model required" },
        { status: 400 }
      );
    }

    publish(projectId!, {
      status: "starting",
      message: "Running pre-flight checks...",
      progress: 0,
    });

    const preflight = await runPreflight(provider);
    if (!preflight.ok) {
      const errorMsg = preflight.errors.join("; ");
      publish(projectId!, {
        status: "error",
        message: errorMsg,
        progress: 0,
        error: errorMsg,
      });
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    publish(projectId!, {
      status: "starting",
      message: "Starting video generation...",
      progress: 0,
    });

    let result: PipelineResult;
    try {
      result = await runPipeline(project, { provider, model, projectId: projectId! });
    } catch (pipelineError) {
      // Pipeline failed partway through — try to recover partial results
      console.error("[API] Pipeline failed, attempting recovery:", pipelineError);

      // Re-run orchestrator in recovery mode to get whatever was generated
      const { runPipelineRecovery } = await import("@/lib/pipeline/orchestrator");
      const recovery = await runPipelineRecovery(project, { provider, model, projectId: projectId! });

      if (recovery.scenes.length > 0) {
        // Return partial success with scenes so user doesn't lose work
        publish(projectId!, {
          status: "error",
          message: `Generation failed during rendering: ${pipelineError instanceof Error ? pipelineError.message : "Unknown error"}. Your scenes were saved — you can retry export.`,
          progress: 0,
          error: pipelineError instanceof Error ? pipelineError.message : "Pipeline failed",
        });

        return NextResponse.json({
          success: false,
          partial: true,
          error: pipelineError instanceof Error ? pipelineError.message : "Pipeline failed",
          scenes: recovery.scenes,
          scenesCount: recovery.scenes.length,
        }, { status: 200 });
      }

      throw pipelineError;
    }

    return NextResponse.json({
      success: true,
      videoPath: result.videoPath,
      duration: result.duration,
      scenesCount: result.scenes.length,
      scenes: result.scenes,
    });
  } catch (error) {
    console.error("[API] Pipeline error:", error);

    if (projectId) {
      publish(projectId!, {
        status: "error",
        message: error instanceof Error ? error.message : "Pipeline failed",
        progress: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Pipeline failed",
      },
      { status: 500 }
    );
  }
}
