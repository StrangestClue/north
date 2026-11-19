import { exec } from "child_process";
import { promisify } from "util";
import { access } from "fs/promises";
import type { Provider } from "@/types/provider";

const execAsync = promisify(exec);

export interface PreflightResult {
  ok: boolean;
  errors: string[];
}

export async function runPreflight(
  provider: Provider
): Promise<PreflightResult> {
  const errors: string[] = [];

  // Check FFmpeg
  try {
    await execAsync("ffmpeg -version");
  } catch {
    errors.push("FFmpeg not found. Install with: brew install ffmpeg");
  }

  // Check FFprobe
  try {
    await execAsync("ffprobe -version");
  } catch {
    errors.push("FFprobe not found. Install with: brew install ffmpeg");
  }

  // Check edge-tts
  try {
    await execAsync("which edge-tts");
  } catch {
    const candidates = [
      "/Users/mayuradithya/Library/Python/3.9/bin/edge-tts",
      "/Users/mayuradithya/Library/Python/3.10/bin/edge-tts",
      "/Users/mayuradithya/Library/Python/3.11/bin/edge-tts",
      "/Users/mayuradithya/Library/Python/3.12/bin/edge-tts",
    ];

    let found = false;
    for (const path of candidates) {
      try {
        await access(path);
        found = true;
        break;
      } catch {}
    }

    if (!found) {
      errors.push("edge-tts not found. Install with: pip3 install edge-tts");
    }
  }

  // Check provider connectivity
  if (provider.type === "ollama") {
    try {
      const baseUrl = provider.baseUrl || "http://localhost:11434";
      const res = await fetch(`${baseUrl}/api/tags`);
      if (!res.ok) {
        errors.push(`Ollama not reachable at ${baseUrl}`);
      }
    } catch {
      errors.push(
        `Cannot connect to Ollama at ${provider.baseUrl || "http://localhost:11434"}. Run: ollama serve`
      );
    }
  } else if (provider.apiKey) {
    // For API-based providers, just check the key exists
    // Actual connectivity is tested during generation
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
