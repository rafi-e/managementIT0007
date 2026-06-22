type SSEController = ReadableStreamDefaultController<Uint8Array>;

const globalForSSE = globalThis as unknown as {
  sseClients: Map<string, { userId: string; controller: SSEController }> | undefined;
};

const clients = globalForSSE.sseClients ?? new Map();
const encoder = new TextEncoder();

if (process.env.NODE_ENV !== "production") {
  globalForSSE.sseClients = clients;
}

export function addClient(id: string, userId: string, controller: SSEController) {
  clients.set(id, { userId, controller });
  controller.enqueue(encoder.encode(`retry: 2000\n\n`));
}

export function removeClient(id: string) {
  clients.delete(id);
}

export function broadcast(event: string, data: unknown) {
  const notif = data as { userId?: string };
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoded = encoder.encode(message);
  for (const [id, client] of clients) {
    try {
      if (!notif.userId || client.userId === notif.userId) {
        client.controller.enqueue(encoded);
      }
    } catch {
      clients.delete(id);
    }
  }
}
