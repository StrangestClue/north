import type { Project, Scene, SceneType, TransitionType, SceneVisuals, StockFootageVisuals } from "@/types/project";
import type { Provider } from "@/types/provider";
import { generateWithProvider } from "./providers";
import { visualsToLayers } from "@/lib/layer-utils";

interface ParsedScene {
  type?: SceneType;
  narration?: string;
  duration?: number | null;
  visuals?: SceneVisuals;
  transition_in?: TransitionType;
  transition_out?: TransitionType;
}

export async function generateScript(
  project: Project,
  provider: Provider,
  model: string
): Promise<Scene[]> {
  const MIN_DURATION = 420; // 7 minutes minimum
  const MAX_SCENES = 40;

  console.log(`[ScriptEngine] Generating script for: ${project.title}`);

  let allScenes: Scene[] = [];
  let attempts = 0;
  const maxAttempts = 3;

  while (allScenes.length < MAX_SCENES && attempts < maxAttempts) {
    const prompt = buildPrompt(project, allScenes, attempts);

    try {
      const result = await generateWithProvider({ provider, model, prompt });
      console.log(`[ScriptEngine] Response length: ${result.response.length} chars`);

      const newScenes = parseScenes(result.response);
      console.log(`[ScriptEngine] Parsed ${newScenes.length} new scenes`);

      if (newScenes.length === 0) {
        console.error(`[ScriptEngine] No scenes parsed on attempt ${attempts + 1}`);
        break;
      }

      // De-duplicate: skip scenes that are too similar to existing ones
      const filtered = newScenes.filter((scene) => {
        const isDup = allScenes.some(
          (s) => s.narration && scene.narration && 
          s.narration.substring(0, 30) === scene.narration.substring(0, 30)
        );
        return !isDup;
      });

      allScenes = [...allScenes, ...filtered];

      // Calculate estimated duration
      const estimatedDuration = allScenes.reduce((sum, s) => {
        const wordCount = s.narration ? s.narration.split(/\s+/).length : 0;
        return sum + (s.duration || Math.max(7, wordCount * 0.6));
      }, 0);

      console.log(`[ScriptEngine] Total scenes: ${allScenes.length}, est. duration: ${estimatedDuration.toFixed(1)}s`);

      if (estimatedDuration >= MIN_DURATION) {
        console.log(`[ScriptEngine] Reached target duration (${estimatedDuration.toFixed(0)}s >= ${MIN_DURATION}s)`);
        break;
      }

      attempts++;
    } catch (error) {
      console.error(`[ScriptEngine] Generation failed on attempt ${attempts + 1}:`, error);
      if (allScenes.length === 0) throw error;
      break;
    }
  }

  if (allScenes.length === 0) {
    throw new Error("Failed to generate any scenes");
  }

  // Fetch stock images for relevant scenes
  const scenesWithMedia = await fetchStockMedia(allScenes);

  // Auto-convert all scenes to layered format
  const scenesWithLayers = scenesWithMedia.map((scene) => ({
    ...scene,
    layers: visualsToLayers(scene.type, scene.visuals),
  }));

  console.log(`[ScriptEngine] Final scene count: ${scenesWithLayers.length}`);
  return scenesWithLayers;
}

async function fetchStockMedia(scenes: Scene[]): Promise<Scene[]> {
  // Fetch images for stock_footage scenes and also for carousel/text scenes as background
  const updatedScenes = await Promise.all(
    scenes.map(async (scene) => {
      if (scene.type === "stock_footage") {
        const visuals = scene.visuals as StockFootageVisuals;
        if (visuals.query) {
          try {
            const media = await fetchStockImage(visuals.query);
            if (media) {
              return {
                ...scene,
                visuals: {
                  ...visuals,
                  mediaUrl: media.url,
                  mediaType: "image" as const,
                  thumbnail: media.thumbnail,
                },
              };
            }
          } catch (error) {
            console.error(`[Stock] Failed for "${visuals.query}":`, error);
          }
        }
      }
      return scene;
    })
  );

  return updatedScenes;
}

async function fetchStockImage(query: string): Promise<{ url: string; thumbnail: string } | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    // Use images instead of videos - more reliable and faster
    const res = await fetch(
      `${baseUrl}/api/stock?q=${encodeURIComponent(query)}&type=image&per_page=3`,
      { cache: "no-store" }
    );
    
    if (!res.ok) {
      console.log(`[Stock] API returned ${res.status} for "${query}"`);
      return null;
    }

    const data = await res.json();
    if (data.results && data.results.length > 0) {
      // Pick a random result for variety
      const result = data.results[Math.floor(Math.random() * data.results.length)];
      console.log(`[Stock] Found image for "${query}": ${result.id}`);
      return {
        url: result.url,
        thumbnail: result.thumbnail,
      };
    }
    console.log(`[Stock] No results for "${query}"`);
  } catch (error) {
    console.error(`[Stock] Error fetching "${query}":`, error);
  }
  return null;
}

function buildPrompt(project: Project, existingScenes: Scene[] = [], attempt: number = 0): string {
  const targetMinutes = attempt === 0 ? "7-8" : "additional";
  const contextText = existingScenes.length > 0
    ? `\n\n## CONTINUATION REQUIRED\nYou already generated ${existingScenes.length} scenes. The total duration is still too short. Generate ${attempt === 0 ? "15-25" : "10-20"} MORE scenes to continue and complete the topic. Do NOT repeat content from these existing scenes:\n${existingScenes.slice(-5).map(s => `- ${s.narration?.substring(0, 80)}...`).join('\n')}`
    : "";

  return `You are an expert video director and educational content creator. Create a detailed video script for: "${project.title}"

## REQUIREMENTS
- Target length: ${targetMinutes} minutes (420-480 seconds total)${attempt > 0 ? " - this is a CONTINUATION" : ""}
- Create ${attempt === 0 ? "15-25" : "10-20"} scenes${attempt > 0 ? " ADDITIONAL scenes" : ""}
- Each scene MUST have substantial narration (3-5 sentences, 40-80 words)
- Each scene MUST be 20-35 seconds of spoken content
- Content must be educational, engaging, and factually accurate
- Cover the topic thoroughly with depth and detail${contextText}

## SCENE TYPE GUIDELINES
Analyze the content of each segment and choose the BEST visual representation:

**title_card**: Use for the main title and major section headers. Clean, bold text.
**text_overlay**: Use for body content, explanations, and key concepts. Large readable text.
**carousel**: Use when listing 3+ related points, steps, features, or examples. Shows bullets as cards.
**diagram**: Use ONLY when showing relationships, processes, architectures, or flows. Generate relevant mermaid flowcharts.
**stock_footage**: Use for visual examples, real-world imagery, or when text needs visual backing. Include a search query.
**code_walkthrough**: Use ONLY when showing actual code examples.

## MERMAID DIAGRAM RULES
- ONLY generate diagrams that are RELEVANT to the topic context
- For "${project.title}", create meaningful flowcharts showing actual concepts
- Use proper mermaid syntax: graph TD, graph LR, flowchart TD, etc.
- Make diagrams detailed with 4-8 nodes showing real relationships
- Example for neural networks: 
  graph TD
    A[Input Layer<br/>784 neurons] --> B[Hidden Layer 1<br/>128 neurons]
    B --> C[Hidden Layer 2<br/>64 neurons]
    C --> D[Output Layer<br/>10 neurons]
    B --> E[ReLU Activation]
    C --> F[ReLU Activation]
    D --> G[Softmax]

## STOCK FOOTAGE QUERIES
When using stock_footage, provide SPECIFIC search queries related to the content:
- Good: "artificial neural network visualization", "machine learning data processing"
- Bad: "technology", "abstract background"

## NARRATION GUIDELINES - CRITICAL
- Write naturally spoken narration, not bullet points
- EACH scene MUST be 25-40 seconds of spoken content (60-100 words minimum)
- Use clear, educational language with examples and elaboration
- Include transitions between concepts
- Total narration should tell a complete, thorough story
- BE VERBOSE AND DETAILED - explain concepts deeply, don't just mention them
- Add concrete examples, analogies, and context to every point
- If a scene feels too short, expand with more detail, examples, or implications

## OUTPUT FORMAT
Return a JSON array. Each scene:
{
  "type": "scene_type",
  "narration": "The narrator will speak this text... Must be 60-100+ words per scene...",
  "duration": 30,
  "visuals": { /* scene-specific data */ },
  "transition_in": "fade_from_black",
  "transition_out": "crossfade"
}

Scene type visual data:
- title_card: { "title": "Main Title", "subtitle": "Optional subtitle" }
- text_overlay: { "text": "The key concept explained here" }
- carousel: { "slides": [{ "title": "Section Title", "bullets": ["Point 1", "Point 2", "Point 3"] }] }
- diagram: { "engine": "mermaid", "source": "graph TD\\n  A[Node] --> B[Node]" }
- stock_footage: { "engine": "pexels", "query": "specific search terms", "overlay_text": "Optional text overlay" }
- code_walkthrough: { "engine": "code_highlight", "language": "python", "source": "print('hello')" }

Generate the complete script now.`;
}

function parseScenes(response: string): Scene[] {
  try {
    let cleaned = response.trim();
    
    // Remove markdown code blocks
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    
    // Try to find JSON array
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : cleaned;
    
    const parsed = JSON.parse(jsonStr);
    const scenes = Array.isArray(parsed) ? parsed : parsed.scenes || [];

    if (scenes.length === 0) {
      console.error(`[ScriptEngine] No scenes found in response`);
      return [];
    }

    console.log(`[ScriptEngine] Raw scenes: ${scenes.length}`);

    return scenes.map((scene: ParsedScene, index: number) => ({
      id: `scene-${index}`,
      type: scene.type || "text_overlay",
      narration: scene.narration || "",
      duration: scene.duration || null,
      visuals: scene.visuals || {},
      transition_in: scene.transition_in || "crossfade",
      transition_out: scene.transition_out || "crossfade",
      order: index,
    }));
  } catch (error) {
    console.error("[ScriptEngine] Parse error:", error);
    console.error("[ScriptEngine] Response:", response.substring(0, 2000));
    return [];
  }
}
