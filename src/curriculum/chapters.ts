import { Chapter } from "@/lib/lessons/types";
import chapters from "./generated/chapters.json";

// The full ladder: knowing nothing -> MWCC GC/2.0 master. Compiled from each
// chapter's _chapter.md by scripts/build-curriculum.mjs, sorted by order.
export const CHAPTERS = chapters as unknown as Chapter[];

// A chapter id is only unique within its tier (two tiers can each have a
// "finale"; ids also restart per course), so a chapter is addressed by the full
// (course, tier, id). Keying by anything less collapses distinct chapters.
const byKey = new Map(CHAPTERS.map((c) => [`${c.course}/${c.tier}/${c.id}`, c]));

export function getChapter(course: string, tier: string, id: string): Chapter | undefined {
  return byKey.get(`${course}/${tier}/${id}`);
}
