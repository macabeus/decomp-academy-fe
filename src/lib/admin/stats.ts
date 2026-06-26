"use client";

import { api } from "@/lib/auth/api";
import { LESSONS, CHAPTER_BY_ID } from "@/lib/lessons/registry";

// Server-side `lessonId` is the lesson's progressId (see lessons/service.ts).
export interface CompileStat {
  lessonId: string;
  attempts: number;
  failures: number;
  failRate: number;
  lastAt?: string;
}

export interface LessonStatRow {
  progressId: string;
  title: string;
  chapter: string;
  attempts: number;
  failures: number;
  failRate: number;
  lastAt?: string;
}

// Every exercise lesson left-joined with its compile stats, so lessons nobody
// has attempted still show with zeroes. Sorted by failures, then attempts.
export async function getLessonStats(): Promise<LessonStatRow[]> {
  const { lessons } = await api<{ lessons: CompileStat[] }>("/stats");
  const byId = new Map(lessons.map((s) => [s.lessonId, s]));

  const rows = LESSONS.filter((l) => !l.concept).map((l) => {
    const s = byId.get(l.progressId);
    return {
      progressId: l.progressId,
      title: l.title,
      chapter: CHAPTER_BY_ID.get(l.chapter)?.title ?? l.chapter,
      attempts: s?.attempts ?? 0,
      failures: s?.failures ?? 0,
      failRate: s?.failRate ?? 0,
      lastAt: s?.lastAt,
    };
  });

  rows.sort((a, b) => b.failures - a.failures || b.attempts - a.attempts);
  return rows;
}
