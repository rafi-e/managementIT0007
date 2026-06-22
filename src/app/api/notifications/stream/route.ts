export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { auth } from "@/lib/auth";
import { addClient, removeClient } from "@/lib/sse";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  let clientId: string | null = null;

  const stream = new ReadableStream({
    start(controller) {
      clientId = crypto.randomUUID();
      addClient(clientId, session.user.id!, controller);

      req.signal.addEventListener("abort", () => {
        if (clientId) removeClient(clientId);
      });

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepAlive);
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
