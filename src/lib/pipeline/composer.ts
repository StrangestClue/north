import { exec } from "child_process";
import { promisify } from "util";
import { mkdir, readdir, access } from "fs/promises";
import path from "path";
import type { Scene } from "@/types/project";
import type { LayerRenderResult } from "./renderer";

const execAsync = promisify(exec);

export interface CompositionOptions {
  projectId: string;
  scenes: Array<{
    scene: Scene;
    layerResults: LayerRenderResult[];
    audioPath: string;
    duration: number;
  }>;
  backgroundMusic?: {
    trackPath: string;
    volume: number;
    ducking: boolean;
    duckingRatio: number;
    normalRatio: number;
  };
  outputPath: string;
}

export async function compose(options: CompositionOptions): Promise<string> {
  const { scenes, backgroundMusic, outputPath } = options;
  const tempDir = path.dirname(outputPath);

  const sceneVideos: string[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const { layerResults, audioPath, duration } = scenes[i];
    const sceneVideoPath = path.join(tempDir, `scene-${i}.mp4`);

    try {
      if (layerResults.length === 1) {
        // Single layer - simple frames to video
        await framesToVideo(layerResults[0].framesDir, audioPath, sceneVideoPath, duration);
      } else {
        // Multi-layer - composite with FFmpeg
        await compositeLayers(layerResults, audioPath, sceneVideoPath, duration);
      }

      await access(sceneVideoPath);
      sceneVideos.push(sceneVideoPath);
    } catch (error) {
      console.error(`[Composer] Failed to create scene ${i}:`, error);
      throw new Error(`Failed to create scene ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  if (sceneVideos.length === 0) {
    throw new Error("No scene videos were created");
  }

  const concatPath = path.join(tempDir, "concat.txt");
  const concatContent = sceneVideos
    .map((v) => `file '${v.replace(/'/g, "'\\''")}'`)
    .join("\n");

  const { writeFile } = await import("fs/promises");
  await writeFile(concatPath, concatContent);

  console.log(`[Composer] Concat file:\n${concatContent}`);

  const noMusicPath = path.join(tempDir, "no-music.mp4");

  try {
    await execAsync(
      `ffmpeg -y -f concat -safe 0 -i "${concatPath}" -c copy "${noMusicPath}"`
    );
  } catch (error) {
    console.error(`[Composer] Concat failed:`, error);
    throw new Error(`Failed to concatenate scenes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  if (backgroundMusic) {
    await addBackgroundMusic(noMusicPath, backgroundMusic, outputPath);
  } else {
    await execAsync(`ffmpeg -y -i "${noMusicPath}" -c copy "${outputPath}"`);
  }

  return outputPath;
}

async function framesToVideo(
  framesDir: string,
  audioPath: string,
  outputPath: string,
  duration: number
): Promise<void> {
  const framePattern = path.join(framesDir, "frame-%05d.png");

  try {
    const frames = await readdir(framesDir);
    const pngFrames = frames.filter(f => f.endsWith('.png'));
    if (pngFrames.length === 0) {
      throw new Error(`No PNG frames found in ${framesDir}`);
    }
    console.log(`[Composer] Found ${pngFrames.length} frames for scene`);
  } catch (error) {
    throw new Error(`Frames directory not found: ${framesDir}`);
  }

  const cmd = [
    "ffmpeg -y",
    `-framerate 30`,
    `-i "${framePattern}"`,
    `-i "${audioPath}"`,
    `-t ${duration}`,
    `-c:v libx264`,
    `-pix_fmt yuv420p`,
    `-c:a aac`,
    `-shortest`,
    `"${outputPath}"`,
  ].join(" ");

  try {
    await execAsync(cmd);
  } catch (error) {
    console.error(`[Composer] FFmpeg command failed: ${cmd}`);
    throw error;
  }
}

async function compositeLayers(
  layerResults: LayerRenderResult[],
  audioPath: string,
  outputPath: string,
  duration: number
): Promise<void> {
  if (layerResults.length < 2) {
    throw new Error(`compositeLayers requires at least 2 layers, got ${layerResults.length}`);
  }

  // Sort by zIndex
  const sorted = [...layerResults].sort((a, b) => a.zIndex - b.zIndex);

  // Verify all frame directories exist
  for (const layer of sorted) {
    try {
      const frames = await readdir(layer.framesDir);
      const pngs = frames.filter(f => f.endsWith('.png'));
      if (pngs.length === 0) {
        throw new Error(`Layer ${layer.layerId} has no frames in ${layer.framesDir}`);
      }
      console.log(`[Composer] Layer ${layer.layerId}: ${pngs.length} frames`);
    } catch (err) {
      throw new Error(`Layer ${layer.layerId} frames not found: ${layer.framesDir}`);
    }
  }

  // Build FFmpeg filter_complex for overlay compositing
  const inputs: string[] = [];
  const filters: string[] = [];

  // Add each layer as an input
  for (let i = 0; i < sorted.length; i++) {
    const layer = sorted[i];
    inputs.push(`-framerate 30 -i "${path.join(layer.framesDir, "frame-%05d.png")}"`);
  }

  // Build overlay chain
  let currentOutput = "[0:v]";
  for (let i = 1; i < sorted.length; i++) {
    const nextInput = `[${i}:v]`;
    const tmpOutput = i === sorted.length - 1 ? "[video_out]" : `[tmp${i}]`;
    filters.push(`${currentOutput}${nextInput}overlay=0:0:format=auto${tmpOutput}`);
    currentOutput = tmpOutput;
  }

  // For exactly 2 layers, simplify
  if (sorted.length === 2) {
    filters.length = 0;
    filters.push(`[0:v][1:v]overlay=0:0:format=auto[video_out]`);
  }

  const filterComplex = filters.join(";");
  const audioIndex = sorted.length;

  const cmd = [
    "ffmpeg -y",
    ...inputs,
    `-i "${audioPath}"`,
    `-filter_complex "${filterComplex}"`,
    `-map "[video_out]"`,
    `-map ${audioIndex}:a`,
    `-t ${duration}`,
    `-c:v libx264`,
    `-pix_fmt yuv420p`,
    `-c:a aac`,
    `-shortest`,
    `"${outputPath}"`,
  ].join(" ");

  console.log(`[Composer] Layer composite command:\n${cmd}`);

  try {
    await execAsync(cmd);
    console.log(`[Composer] Layer composite succeeded: ${outputPath}`);
  } catch (error) {
    console.error(`[Composer] Layer composite failed:`, error);
    console.error(`[Composer] Command was: ${cmd}`);
    throw new Error(`FFmpeg layer composite failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function addBackgroundMusic(
  videoPath: string,
  music: CompositionOptions["backgroundMusic"],
  outputPath: string
): Promise<void> {
  if (!music) return;

  const { trackPath, volume, ducking, duckingRatio, normalRatio } = music;

  if (ducking) {
    const filter = [
      `[1:a][0:a]sidechaincompress=threshold=0.02:ratio=10:attack=50:release=300[ducked]`,
      `[ducked]volume=${normalRatio}[music_ducked]`,
      `[0:a][music_ducked]amix=inputs=2:duration=first:dropout_transition=2[out]`,
    ].join(";");

    const cmd = [
      "ffmpeg -y",
      `-i "${videoPath}"`,
      `-i "${trackPath}"`,
      `-filter_complex "${filter}"`,
      `-map 0:v`,
      `-map "[out]"`,
      `-c:v copy`,
      `-c:a aac`,
      `-shortest`,
      `"${outputPath}"`,
    ].join(" ");

    await execAsync(cmd);
  } else {
    const cmd = [
      "ffmpeg -y",
      `-i "${videoPath}"`,
      `-i "${trackPath}"`,
      `-filter_complex "[1:a]volume=${volume}[music];[0:a][music]amix=inputs=2:duration=first[out]"`,
      `-map 0:v`,
      `-map "[out]"`,
      `-c:v copy`,
      `-c:a aac`,
      `-shortest`,
      `"${outputPath}"`,
    ].join(" ");

    await execAsync(cmd);
  }
}
