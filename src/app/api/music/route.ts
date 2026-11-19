import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { MusicLibrary, MusicTrack } from "@/types/project";

const MUSIC_DIR = path.join(process.cwd(), "public", "music");
const LIBRARY_FILE = path.join(MUSIC_DIR, "music-library.json");
const ALLOWED_FORMATS = ["mp3", "wav", "ogg", "flac", "m4a"];

async function readLibrary(): Promise<MusicLibrary> {
  try {
    const data = await readFile(LIBRARY_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { tracks: [] };
  }
}

async function writeLibrary(library: MusicLibrary): Promise<void> {
  await writeFile(LIBRARY_FILE, JSON.stringify(library, null, 2));
}

export async function GET() {
  const library = await readLibrary();
  return NextResponse.json(library.tracks);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_FORMATS.includes(ext)) {
    return NextResponse.json(
      { error: `Unsupported format. Allowed: ${ALLOWED_FORMATS.join(", ")}` },
      { status: 400 }
    );
  }

  const id = uuidv4();
  const filename = `${id}.${ext}`;
  const filepath = path.join(MUSIC_DIR, filename);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filepath, buffer);

  let duration = 0;
  try {
    const { parseBuffer } = await import("music-metadata");
    const metadata = await parseBuffer(buffer, { mimeType: file.type });
    duration = metadata.format.duration ?? 0;
  } catch {
    duration = 0;
  }

  const track: MusicTrack = {
    id,
    filename,
    originalName: file.name,
    format: ext,
    duration,
    size: file.size,
    addedAt: new Date().toISOString(),
  };

  const library = await readLibrary();
  library.tracks.push(track);
  await writeLibrary(library);

  return NextResponse.json(track);
}
