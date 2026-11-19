import type { Provider } from "@/types/provider";

export interface GenerateOptions {
  provider: Provider;
  model: string;
  prompt: string;
}

export interface GenerateResult {
  response: string;
  error?: string;
}

export async function generateWithProvider(
  options: GenerateOptions
): Promise<GenerateResult> {
  const { provider, model, prompt } = options;

  switch (provider.type) {
    case "ollama":
      return generateWithOllama(provider, model, prompt);
    case "openai":
      return generateWithOpenAI(provider, model, prompt);
    case "anthropic":
      return generateWithAnthropic(provider, model, prompt);
    case "google":
      return generateWithGoogle(provider, model, prompt);
    case "groq":
      return generateWithGroq(provider, model, prompt);
    case "custom":
      return generateWithCustom(provider, model, prompt);
    default:
      throw new Error(`Unsupported provider type: ${provider.type}`);
  }
}

async function generateWithOllama(
  provider: Provider,
  model: string,
  prompt: string
): Promise<GenerateResult> {
  const baseUrl = provider.baseUrl || "http://localhost:11434";

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: "json",
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`);
  }

  const data = await response.json();
  return { response: data.response };
}

async function generateWithOpenAI(
  provider: Provider,
  model: string,
  prompt: string
): Promise<GenerateResult> {
  const baseUrl = provider.baseUrl || "https://api.openai.com/v1";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return { response: data.choices[0].message.content };
}

async function generateWithAnthropic(
  provider: Provider,
  model: string,
  prompt: string
): Promise<GenerateResult> {
  const baseUrl = provider.baseUrl || "https://api.anthropic.com";

  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": provider.apiKey || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();
  return { response: data.content[0].text };
}

async function generateWithGoogle(
  provider: Provider,
  model: string,
  prompt: string
): Promise<GenerateResult> {
  const baseUrl =
    provider.baseUrl || "https://generativelanguage.googleapis.com";

  const response = await fetch(
    `${baseUrl}/v1beta/models/${model}:generateContent?key=${provider.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Google API error: ${response.statusText}`);
  }

  const data = await response.json();
  return { response: data.candidates[0].content.parts[0].text };
}

async function generateWithCustom(
  provider: Provider,
  model: string,
  prompt: string
): Promise<GenerateResult> {
  if (!provider.baseUrl) {
    throw new Error("Custom provider requires baseUrl");
  }

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey || "no-key"}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`Custom API error: ${response.statusText}`);
  }

  const data = await response.json();
  return { response: data.choices[0].message.content };
}

async function generateWithGroq(
  provider: Provider,
  model: string,
  prompt: string
): Promise<GenerateResult> {
  const baseUrl = provider.baseUrl || "https://api.groq.com/openai/v1";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are a helpful assistant that responds with valid JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return { response: data.choices[0].message.content };
}
