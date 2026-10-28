import type { Coords, ParcheVibe } from "./types";
import {
  addCommentRemote,
  createParche,
  createSpot,
  toggleCheckin,
  toggleGoing,
} from "./supabase/api";
import { bumpAttempt, clearOfflineQueue, getOfflineQueue, type OfflineAction } from "./offline";

const OFFLINE_KEY = "parchexbogota-offline-queue";

function saveRemaining(actions: OfflineAction[]) {
  if (actions.length) {
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(actions));
  } else {
    clearOfflineQueue();
  }
}

export async function flushOfflineQueue(userId: string): Promise<number> {
  const queue = getOfflineQueue();
  if (!queue.length) return 0;

  const remaining: OfflineAction[] = [];
  let processed = 0;

  for (const action of queue) {
    if (action.payload?._needsPhoto) {
      // Requiere nueva foto del usuario; no reintentar en silencio.
      remaining.push(action);
      continue;
    }
    try {
      switch (action.type) {
        case "publish_parche": {
          const p = action.payload as {
            title: string;
            description: string;
            photoUrl: string;
            coords: Coords;
            vibe: ParcheVibe;
            address?: string;
            neighborhood?: string;
          };
          await createParche(userId, p);
          processed++;
          break;
        }
        case "publish_spot": {
          const s = action.payload as {
            title: string;
            description: string;
            photoUrl: string;
            coords: Coords;
            neighborhood: string;
            vibe: ParcheVibe;
          };
          await createSpot(userId, s);
          processed++;
          break;
        }
        case "comment": {
          const c = action.payload as { targetType: "parche" | "spot"; targetId: string; text: string };
          await addCommentRemote(userId, c.targetType, c.targetId, c.text);
          processed++;
          break;
        }
        case "going": {
          const g = action.payload as { parcheId: string; active: boolean };
          await toggleGoing(userId, g.parcheId, g.active);
          processed++;
          break;
        }
        case "checkin": {
          const c = action.payload as { parcheId: string; active: boolean };
          await toggleCheckin(userId, c.parcheId, c.active);
          processed++;
          break;
        }
      }
    } catch {
      const bumped = bumpAttempt(action);
      if (bumped) remaining.push(bumped);
    }
  }

  saveRemaining(remaining);
  return processed;
}
