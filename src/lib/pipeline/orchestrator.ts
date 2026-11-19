import { mkdir } from "fs/promises";
import path from "path";
import type { Project, Scene } from "@/types/project";
import type { Provider } from "@/types/provider";
import type { VideoTemplate } from "@/types/template";
import { getTemplateById } from "@/types/template";
import { generateScript } from "./script-engine";
import { generateTTS, type WordTiming } from "./tts-engine";
import { renderScene, renderLayer, type RenderResult, type LayerRenderResult } from "./renderer";
import { compose, type CompositionOptions } from "./composer";
import { publish } from "@/lib/progress";

export interface PipelineResult {
  videoPath: string;
  scenes: Scene[];
  duration: number;
}

export interface PipelineConfig {
  provider: Provider;
  model: string;
  projectId: string;
}

function emit(projectId: string, update: Partial<import("@/types/progress").ProgressUpdate>) {
  publish(projectId, {
    status: "idle",
    message: "",
    progress: 0,
    ...update,
  });
}

function calculateWordTimings(text: string, duration: number): WordTiming[] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return [];

  const wordWeights = words.map(w => Math.max(0.5, w.length * 0.15));
  const totalWeight = wordWeights.reduce((a, b) => a + b, 0);

  const timings: WordTiming[] = [];
  let currentTime = 0;

  for (let i = 0; i < words.length; i++) {
    const wordDuration = (wordWeights[i] / totalWeight) * duration;
    timings.push({
      word: words[i],
      start: currentTime,
      end: currentTime + wordDuration,
    });
    currentTime += wordDuration;
  }

  return timings;
}

export async function runPipeline(
  project: Project,
  config: PipelineConfig
): Promise<PipelineResult> {
  const { projectId } = config;
  const workDir = path.join(process.cwd(), "tmp", project.id);
  const outputDir = path.join(process.cwd(), "public", "output");

  await mkdir(workDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });

  // Resolve template
  const template = getTemplateById(project.templateId || "clean-minimal-cinematic") || (await import("@/types/template")).DEFAULT_TEMPLATE;
  console.log(`[Pipeline] Using template: ${template.name}`);

  emit(projectId, { status: "starting", message: "Starting pipeline...", progress: 0 });

  let scenes = project.scenes;
  if (scenes.length === 0) {
    emit(projectId, { status: "generating_script", message: `Generating script with ${config.provider.name}/${config.model}...`, progress: 5 });

    try {
      scenes = await generateScript(project, config.provider, config.model);
      console.log(`[Pipeline] Generated ${scenes.length} scenes`);

      if (scenes.length === 0) {
        throw new Error("Script generation returned empty. The model may not support JSON output or the response format is incorrect.");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error(`[Pipeline] Script generation failed:`, error);
      throw new Error(`Failed to generate scenes: ${errorMsg}. Check your provider configuration and ensure the model supports JSON output.`);
    }

    emit(projectId, { status: "generating_script", message: `Generated ${scenes.length} scenes`, progress: 10 });
  }

  const sceneData: Array<{
    scene: Scene;
    layerResults: LayerRenderResult[];
    audioPath: string;
    duration: number;
  }> = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const sceneDir = path.join(workDir, `scene-${i}`);
    await mkdir(sceneDir, { recursive: true });

    const sceneProgress = 10 + (i / scenes.length) * 80;
    emit(projectId, {
      status: "generating_tts",
      message: `Scene ${i + 1}/${scenes.length}: Generating narration...`,
      progress: sceneProgress,
      sceneIndex: i,
      totalScenes: scenes.length,
    });

    const audioPath = path.join(sceneDir, "audio.mp3");
    const ttsResult = await generateTTS(scene.narration, audioPath);

    const ttsDuration = ttsResult.duration || 5;
    const llmDuration = scene.duration || 0;
    const duration = Math.max(7, Math.max(ttsDuration, llmDuration));

    const wordTimings = calculateWordTimings(scene.narration, ttsDuration);

    emit(projectId, {
      status: "rendering_frames",
      message: `Scene ${i + 1}/${scenes.length}: Rendering frames (${duration}s)...`,
      progress: sceneProgress + 5,
      sceneIndex: i,
      totalScenes: scenes.length,
    });

    // Determine rendering strategy based on layers
    const hasMultipleLayers = scene.layers && scene.layers.length > 1;
    let layerResults: LayerRenderResult[] = [];

    if (hasMultipleLayers) {
      // Multi-layer rendering
      console.log(`[Pipeline] Scene ${i + 1}: Rendering ${scene.layers.length} layers`);
      for (const layer of scene.layers) {
        const result = await renderLayer(layer, duration, scene.type, template, sceneDir, wordTimings);
        layerResults.push(result);
      }
    } else {
      // Legacy single-render fallback
      const result = await renderScene(scene, duration, sceneDir, wordTimings, template);
      layerResults.push({
        layerId: "legacy",
        framesDir: result.framesDir,
        frameCount: result.frameCount,
        zIndex: 0,
        isTransparent: false,
      });
    }

    sceneData.push({
      scene,
      layerResults,
      audioPath,
      duration,
    });
  }

  emit(projectId, { status: "composing", message: "Composing final video...", progress: 90 });
  const outputPath = path.join(outputDir, `${project.id}.mp4`);

  const compositionOptions: CompositionOptions = {
    projectId: project.id,
    scenes: sceneData,
    outputPath,
  };

  if (project.backgroundMusic) {
    const musicLibraryPath = path.join(process.cwd(), "public", "music", "music-library.json");
    let musicFilename = `${project.backgroundMusic.trackId}.mp3`;

    try {
      const { readFile } = await import("fs/promises");
      const libraryData = await readFile(musicLibraryPath, "utf-8");
      const library = JSON.parse(libraryData);
      const track = library.tracks?.find((t: { id: string; filename: string }) => t.id === project.backgroundMusic?.trackId);
      if (track) {
        musicFilename = track.filename;
      }
    } catch {
      // Fallback to trackId.mp3 if library read fails
    }

    const musicPath = path.join(process.cwd(), "public", "music", musicFilename);

    compositionOptions.backgroundMusic = {
      trackPath: musicPath,
      volume: project.backgroundMusic.volume,
      ducking: project.backgroundMusic.ducking,
      duckingRatio: project.backgroundMusic.duckingRatio,
      normalRatio: project.backgroundMusic.normalRatio,
    };
  }

  await compose(compositionOptions);

  const totalDuration = sceneData.reduce((sum, s) => sum + s.duration, 0);

  emit(projectId, { status: "complete", message: "Video generation complete!", progress: 100 });

  return {
    videoPath: outputPath,
    scenes,
    duration: totalDuration,
  };
}

// ─── RECOVERY: Generate scenes without rendering ─────────────────

export async function runPipelineRecovery(
  project: Project,
  config: PipelineConfig
): Promise<PipelineResult> {
  const { projectId } = config;

  emit(projectId, { status: "starting", message: "Recovering generated scenes...", progress: 0 });

  let scenes = project.scenes;

  // If project already has scenes, return them
  if (scenes.length > 0) {
    const totalDuration = scenes.reduce((sum, s) => sum + (s.duration || 5), 0);
    return { videoPath: "", scenes, duration: totalDuration };
  }

  // Otherwise re-run script generation
  emit(projectId, { status: "generating_script", message: `Regenerating script with ${config.provider.name}/${config.model}...`, progress: 5 });

  try {
    scenes = await generateScript(project, config.provider, config.model);
    console.log(`[PipelineRecovery] Generated ${scenes.length} scenes`);

    if (scenes.length === 0) {
      throw new Error("Script generation returned empty.");
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[PipelineRecovery] Script generation failed:`, error);
    throw new Error(`Failed to generate scenes: ${errorMsg}`);
  }

  const totalDuration = scenes.reduce((sum, s) => sum + (s.duration || 5), 0);

  return { videoPath: "", scenes, duration: totalDuration };
}
