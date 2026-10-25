import { subscribeObsVotes } from "@/lib/live-events";
import { createSseResponse } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return createSseResponse(request.signal, (send) => subscribeObsVotes(send));
}
