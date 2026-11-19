import { NextRequest, NextResponse } from "next/server";
import { generateWithProvider } from "@/lib/pipeline/providers";

export async function POST(request: NextRequest) {
  try {
    const { message, project, provider } = await request.json();

    if (!message || !project) {
      return NextResponse.json(
        { error: "Message and project required" },
        { status: 400 }
      );
    }

    const prompt = buildAssistantPrompt(message, project);

    const result = await generateWithProvider({
      provider,
      model: project.selectedModel,
      prompt,
    });

    // Try to parse JSON response
    let response = result.response;
    let changes = null;

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        response = parsed.response || response;
        changes = parsed.changes || null;
      }
    } catch {
      // Not JSON, use raw response
    }

    return NextResponse.json({ response, changes });
  } catch (error) {
    console.error("[API] Assistant error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}

function buildAssistantPrompt(message: string, project: { title: string; scenes: unknown[]; selectedModel: string | null }): string {
  const scenesJson = JSON.stringify(project.scenes, null, 2);

  return `You are an AI video editor assistant. The user is editing a video project titled "${project.title}".

Current scenes:
${scenesJson}

User request: "${message}"

Respond with a JSON object:
{
  "response": "Your friendly response to the user explaining what you did",
  "changes": {
    "scenes": [ /* optional: full scene array if replacing all scenes */ ],
    "sceneUpdates": [ /* optional: individual scene updates */
      { "sceneId": "scene-0", "updates": { "narration": "new text" } }
    ],
    "title": "optional new title"
  }
}

Only include changes if the user asked for modifications. If they're just asking a question, only include the response field.

Rules:
- Keep narration clear and educational
- Duration should match narration length
- Visuals should be appropriate for the scene type
- Transitions should be one of: fade_from_black, crossfade, slide_left, slide_right, wipe, none`;
}
