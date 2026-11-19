import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import type { MusicLibrary } from "@/types/project";

const MUSIC_DIR = path.join(process.cwd(), "public", "music");
const LIBRARY_FILE = path.join(MUSIC_DIR, "music-library.json");

const MIME_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  flac: "audio/flac",
  m4a: "audio/mp4",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let library: MusicLibrary;
  try {
    const data = await readFile(LIBRARY_FILE, "utf-8");
    library = JSON.parse(data);
  } catch {
    return NextResponse.json({ error: "Library not found" }, { status: 404 });
  }

  const track = library.tracks.find((t) => t.id === id);
  if (!track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  const filepath = path.join(MUSIC_DIR, track.filename);
  const buffer = await readFile(filepath);
  const contentType = MIME_TYPES[track.format] || "audio/mpeg";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": buffer.length.toString(),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
