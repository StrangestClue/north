import { NextRequest, NextResponse } from "next/server";

interface StockProvider {
  id: string;
  name: string;
  type: "pexels" | "pixabay";
  apiKey: string;
  baseUrl?: string;
  enabled: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const provider: StockProvider = await request.json();

    if (!provider.apiKey) {
      return NextResponse.json(
        { error: "API key required" },
        { status: 400 }
      );
    }

    switch (provider.type) {
      case "pexels": {
        const res = await fetch("https://api.pexels.com/videos/popular?per_page=1", {
          headers: { Authorization: provider.apiKey },
        });
        if (!res.ok) {
          return NextResponse.json(
            { success: false, error: "Invalid API key or connection failed" },
            { status: 401 }
          );
        }
        return NextResponse.json({ success: true });
      }
      case "pixabay": {
        const res = await fetch(
          `https://pixabay.com/api/videos/?key=${provider.apiKey}&per_page=1`
        );
        if (!res.ok) {
          return NextResponse.json(
            { success: false, error: "Invalid API key or connection failed" },
            { status: 401 }
          );
        }
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json(
          { error: "Unsupported provider" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[API] Stock test error:", error);
    return NextResponse.json(
      { error: "Connection failed" },
      { status: 500 }
    );
  }
}
