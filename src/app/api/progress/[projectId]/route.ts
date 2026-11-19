import { NextRequest } from "next/server";
import { subscribe, unsubscribe } from "@/lib/progress";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      send(JSON.stringify({ type: "connected" }));

      const unsub = subscribe(projectId, (update) => {
        send(JSON.stringify({ type: "progress", ...update }));
      });

      request.signal.addEventListener("abort", () => {
        unsub();
        unsubscribe(projectId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
