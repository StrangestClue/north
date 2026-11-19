import { NextRequest, NextResponse } from "next/server";
import type { Provider } from "@/types/provider";

interface OllamaTagsResponse {
  models?: Array<{ name: string }>;
}

interface OpenAIModelsResponse {
  data?: Array<{ id: string }>;
}

interface CustomModelsResponse {
  data?: Array<{ id: string }>;
}

interface GroqModelsResponse {
  data?: Array<{ id: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const provider: Provider = await request.json();

    if (!provider || !provider.type) {
      return NextResponse.json(
        { error: "Provider data required" },
        { status: 400 }
      );
    }

    const models = await fetchModels(provider);
    return NextResponse.json({ models });
  } catch (error) {
    console.error("[API] Model fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch models" },
      { status: 500 }
    );
  }
}

async function fetchModels(provider: Provider): Promise<string[]> {
  switch (provider.type) {
    case "ollama": {
      const baseUrl = provider.baseUrl || "http://localhost:11434";
      const res = await fetch(`${baseUrl}/api/tags`);
      if (!res.ok) throw new Error("Failed to fetch Ollama models");
      const data: OllamaTagsResponse = await res.json();
      return data.models?.map((m) => m.name) || [];
    }
    case "openai": {
      const baseUrl = provider.baseUrl || "https://api.openai.com/v1";
      const res = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${provider.apiKey}` },
      });
      if (!res.ok) throw new Error("Failed to fetch OpenAI models");
      const data: OpenAIModelsResponse = await res.json();
      return data.data
        ?.filter((m) => m.id.includes("gpt"))
        .map((m) => m.id) || [];
    }
    case "anthropic": {
      return ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"];
    }
    case "google": {
      return ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash-exp"];
    }
    case "groq": {
      const baseUrl = provider.baseUrl || "https://api.groq.com/openai/v1";
      const res = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${provider.apiKey}` },
      });
      if (!res.ok) throw new Error("Failed to fetch Groq models");
      const data: GroqModelsResponse = await res.json();
      return data.data?.map((m) => m.id) || [];
    }
    case "custom": {
      if (!provider.baseUrl) throw new Error("Custom provider requires baseUrl");
      const res = await fetch(`${provider.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${provider.apiKey || "no-key"}` },
      });
      if (!res.ok) throw new Error("Failed to fetch custom models");
      const data: CustomModelsResponse = await res.json();
      return data.data?.map((m) => m.id) || [];
    }
    default:
      throw new Error(`Unsupported provider type: ${provider.type}`);
  }
}
