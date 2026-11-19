import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

interface StockProvider {
  id: string;
  type: "pexels" | "pixabay";
  apiKey: string;
  enabled: boolean;
}

interface StockVideo {
  id: string;
  url: string;
  thumbnail: string;
  duration: number;
  width: number;
  height: number;
  source: string;
}

interface StockImage {
  id: string;
  url: string;
  thumbnail: string;
  width: number;
  height: number;
  source: string;
}

interface PexelsVideoFile {
  link?: string;
  quality?: string;
  width?: number;
  height?: number;
}

interface PexelsVideo {
  id: number;
  duration?: number;
  image?: string;
  video_files?: PexelsVideoFile[];
}

interface PexelsPhoto {
  id: number;
  width?: number;
  height?: number;
  src?: {
    original?: string;
    medium?: string;
  };
}

interface PixabayVideoFile {
  url?: string;
  width?: number;
  height?: number;
}

interface PixabayVideo {
  id: number;
  duration?: number;
  picture_id?: string;
  videos?: {
    medium?: PixabayVideoFile;
    small?: PixabayVideoFile;
    tiny?: PixabayVideoFile;
  };
}

interface PixabayImage {
  id: number;
  imageWidth?: number;
  imageHeight?: number;
  largeImageURL?: string;
  webformatURL?: string;
}

async function getEnabledProviders(): Promise<StockProvider[]> {
  const providers: StockProvider[] = [];

  // First try config file
  try {
    const configPath = path.join(process.cwd(), "stock-providers.json");
    const data = await readFile(configPath, "utf-8");
    const fileProviders: StockProvider[] = JSON.parse(data);
    providers.push(...fileProviders.filter((p) => p.enabled && p.apiKey));
    console.log(`[StockAPI] Loaded ${providers.length} providers from config file`);
  } catch (err) {
    console.log("[StockAPI] No config file found, checking env vars");
  }

  // Fallback to environment variables
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (pexelsKey && !providers.some((p) => p.type === "pexels")) {
    providers.push({
      id: "pexels-env",
      type: "pexels",
      apiKey: pexelsKey,
      enabled: true,
    });
    console.log("[StockAPI] Added Pexels from env var");
  }

  const pixabayKey = process.env.PIXABAY_API_KEY;
  if (pixabayKey && !providers.some((p) => p.type === "pixabay")) {
    providers.push({
      id: "pixabay-env",
      type: "pixabay",
      apiKey: pixabayKey,
      enabled: true,
    });
    console.log("[StockAPI] Added Pixabay from env var");
  }

  console.log(`[StockAPI] ${providers.length} total providers available`);
  return providers;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const type = searchParams.get("type") || "video";
  const perPage = parseInt(searchParams.get("per_page") || "10");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter required" },
      { status: 400 }
    );
  }

  const providers = await getEnabledProviders();
  if (providers.length === 0) {
    return NextResponse.json(
      { error: "No stock providers configured" },
      { status: 400 }
    );
  }

  try {
    const results: (StockVideo | StockImage)[] = [];

    for (const provider of providers) {
      if (type === "video") {
        const videos = await fetchVideos(provider, query, perPage);
        results.push(...videos);
      } else {
        const images = await fetchImages(provider, query, perPage);
        results.push(...images);
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[API] Stock fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock content" },
      { status: 500 }
    );
  }
}

async function fetchVideos(
  provider: StockProvider,
  query: string,
  perPage: number
): Promise<StockVideo[]> {
  switch (provider.type) {
    case "pexels": {
      const res = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
        { headers: { Authorization: provider.apiKey } }
      );
      if (!res.ok) return [];
      const data: { videos?: PexelsVideo[] } = await res.json();
      return (data.videos || []).map((v) => {
        const file = v.video_files?.find((f) => f.quality === "hd") || v.video_files?.[0];
        return {
          id: `pexels-${v.id}`,
          url: file?.link || "",
          thumbnail: v.image || "",
          duration: v.duration || 0,
          width: file?.width || 1920,
          height: file?.height || 1080,
          source: "pexels",
        };
      });
    }
    case "pixabay": {
      const res = await fetch(
        `https://pixabay.com/api/videos/?key=${provider.apiKey}&q=${encodeURIComponent(query)}&per_page=${perPage}`
      );
      if (!res.ok) return [];
      const data: { hits?: PixabayVideo[] } = await res.json();
      return (data.hits || []).map((v) => {
        const video = v.videos?.medium || v.videos?.small || v.videos?.tiny;
        return {
          id: `pixabay-${v.id}`,
          url: video?.url || "",
          thumbnail: `https://i.vimeocdn.com/video/${v.picture_id}_295x166.jpg`,
          duration: v.duration || 0,
          width: video?.width || 1920,
          height: video?.height || 1080,
          source: "pixabay",
        };
      });
    }
    default:
      return [];
  }
}

async function fetchImages(
  provider: StockProvider,
  query: string,
  perPage: number
): Promise<StockImage[]> {
  switch (provider.type) {
    case "pexels": {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
        { headers: { Authorization: provider.apiKey } }
      );
      if (!res.ok) return [];
      const data: { photos?: PexelsPhoto[] } = await res.json();
      return (data.photos || []).map((p) => ({
        id: `pexels-${p.id}`,
        url: p.src?.original || "",
        thumbnail: p.src?.medium || "",
        width: p.width || 1920,
        height: p.height || 1080,
        source: "pexels",
      }));
    }
    case "pixabay": {
      const res = await fetch(
        `https://pixabay.com/api/?key=${provider.apiKey}&q=${encodeURIComponent(query)}&per_page=${perPage}`
      );
      if (!res.ok) return [];
      const data: { hits?: PixabayImage[] } = await res.json();
      return (data.hits || []).map((p) => ({
        id: `pixabay-${p.id}`,
        url: p.largeImageURL || "",
        thumbnail: p.webformatURL || "",
        width: p.imageWidth || 1920,
        height: p.imageHeight || 1080,
        source: "pixabay",
      }));
    }
    default:
      return [];
  }
}
