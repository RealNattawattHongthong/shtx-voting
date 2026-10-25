import { getLiveAudienceState } from "@/lib/audience-state";
import { subscribeAudience } from "@/lib/live-events";
import { createSseResponse } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const initial = await getLiveAudienceState();
  return createSseResponse(request.signal, (send) => subscribeAudience(send), initial);
}
