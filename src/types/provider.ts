export type ProviderType = "ollama" | "openai" | "anthropic" | "google" | "custom" | "groq";

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  apiKey?: string;
  baseUrl?: string;
  isDefault: boolean;
}

export const PROVIDER_LABELS: Record<ProviderType, string> = {
  ollama: "Ollama (Local)",
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google (Gemini)",
  custom: "Custom (OpenAI-compatible)",
  groq: "Groq",
};

export const PROVIDER_DEFAULTS: Record<ProviderType, { baseUrl?: string }> = {
  ollama: { baseUrl: "http://localhost:11434" },
  openai: { baseUrl: "https://api.openai.com/v1" },
  anthropic: { baseUrl: "https://api.anthropic.com" },
  google: { baseUrl: "https://generativelanguage.googleapis.com" },
  custom: { baseUrl: "" },
  groq: { baseUrl: "https://api.groq.com/openai/v1" },
};
