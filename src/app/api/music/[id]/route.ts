import { NextRequest, NextResponse } from "next/server";
import { readFile, unlink } from "fs/promises";
import path from "path";
import type { MusicLibrary } from "@/types/project";

const MUSIC_DIR = path.join(process.cwd(), "public", "music");
const LIBRARY_FILE = path.join(MUSIC_DIR, "music-library.json");

async function readLibrary(): Promise<MusicLibrary> {
  try {
    const data = await readFile(LIBRARY_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { tracks: [] };
  }
}

async function writeLibrary(library: MusicLibrary): Promise<void> {
  await readFile(LIBRARY_FILE, "utf-8").catch(() => null);
  const { writeFile } = await import("fs/promises");
  await writeFile(LIBRARY_FILE, JSON.stringify(library, null, 2));
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const library = await readLibrary();
  const track = library.tracks.find((t) => t.id === id);

  if (!track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  return NextResponse.json(track);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const library = await readLibrary();
  const track = library.tracks.find((t) => t.id === id);

  if (!track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  try {
    await unlink(path.join(MUSIC_DIR, track.filename));
  } catch {}

  library.tracks = library.tracks.filter((t) => t.id !== id);
  await writeLibrary(library);

  return NextResponse.json({ success: true });
}
