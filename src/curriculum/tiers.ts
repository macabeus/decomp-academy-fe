import { Tier } from "@/lib/lessons/types";
import tiers from "./generated/tiers.json";

// The curriculum "acts" that group chapters on the map. Compiled from each
// tier's _tier.md by scripts/build-curriculum.mjs, sorted by order.
export const TIERS = tiers as unknown as Tier[];

// Tier ids restart per course, so a tier is addressed by (course, id) — see
// the note in chapters.ts on why a bare-id map would collide across courses.
const byKey = new Map(TIERS.map((t) => [`${t.course}/${t.id}`, t]));

export function getTier(course: string, id: string): Tier | undefined {
  return byKey.get(`${course}/${id}`);
}
