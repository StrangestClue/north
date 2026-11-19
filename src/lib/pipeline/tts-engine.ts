import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, access, unlink } from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

export interface WordTiming {
  word: string;
  start: number;
  end: number;
}

export interface TTSResult {
  audioPath: string;
  duration: number;
}

async function findEdgeTTS(): Promise<string> {
  const candidates = [
    "/Users/mayuradithya/Library/Python/3.9/bin/edge-tts",
    "/Users/mayuradithya/Library/Python/3.10/bin/edge-tts",
    "/Users/mayuradithya/Library/Python/3.11/bin/edge-tts",
    "/Users/mayuradithya/Library/Python/3.12/bin/edge-tts",
    path.join(os.homedir(), ".local/bin/edge-tts"),
    "/usr/local/bin/edge-tts",
    "/opt/homebrew/bin/edge-tts",
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {}
  }

  try {
    const { stdout } = await execAsync("which edge-tts");
    return stdout.trim();
  } catch {}

  throw new Error(
    "edge-tts not found. Install with: pip3 install edge-tts"
  );
}

export async function generateTTS(
  text: string,
  outputPath: string,
  voice: string = "en-US-AriaNeural",
  rate: string = "-10%"
): Promise<TTSResult> {
  const tempText = outputPath + ".txt";
  await writeFile(tempText, text, "utf-8");

  try {
    const edgeTtsPath = await findEdgeTTS();
    const cmd = `${edgeTtsPath} --voice ${voice} --rate="${rate}" --file ${tempText} --write-media ${outputPath}`;

    await execAsync(cmd);

    const duration = await getAudioDuration(outputPath);

    return { audioPath: outputPath, duration };
  } finally {
    try {
      await unlink(tempText);
    } catch {}
  }
}

async function getAudioDuration(audioPath: string): Promise<number> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
    );
    return parseFloat(stdout.trim()) || 0;
  } catch {
    return 0;
  }
}
