export function createSseResponse(
  signal: AbortSignal,
  subscribe: (send: (data: unknown) => void) => () => void,
  initialData?: unknown,
): Response {
  const encoder = new TextEncoder();
  let cleanup: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      // Next.js does not reliably cancel the stream when the client goes away; enqueue on a closed
      // controller throws, which kills the process from the heartbeat timer and fails every vote's publish.
      const write = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup?.();
        }
      };
      const send = (data: unknown) => write(`data: ${JSON.stringify(data)}\n\n`);

      const unsubscribe = subscribe(send);
      const heartbeat = setInterval(() => write(": heartbeat\n\n"), 15000);

      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        signal.removeEventListener("abort", onAbort);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };
      const onAbort = () => cleanup?.();
      signal.addEventListener("abort", onAbort);

      if (signal.aborted) {
        cleanup();
        return;
      }
      if (initialData !== undefined) {
        send(initialData);
      }
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
