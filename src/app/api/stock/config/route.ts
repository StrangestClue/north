import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "stock-providers.json");

export async function GET() {
  try {
    const data = await readFile(CONFIG_PATH, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const providers = await request.json();
    await writeFile(CONFIG_PATH, JSON.stringify(providers, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Stock config save error:", error);
    return NextResponse.json(
      { error: "Failed to save configuration" },
      { status: 500 }
    );
  }
}
