import { auth } from "@/auth";
import {
  buildSessionScoresPayload,
  subscribeSessionScores,
} from "@/lib/live-events";
import { createSseResponse } from "@/lib/sse";
import { getSessionById } from "@/services/sessions";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ session_id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { session_id } = await context.params;
  const id = Number.parseInt(session_id, 10);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const row = await getSessionById(id);
  if (!row) {
    notFound();
  }

  const initial = await buildSessionScoresPayload(id);
  return createSseResponse(
    request.signal,
    (send) => subscribeSessionScores(id, send),
    initial,
  );
}
