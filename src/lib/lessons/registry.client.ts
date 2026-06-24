// Client-safe, slim view of the lesson list. Carries only the metadata the
// browser needs for navigation and progress — no briefs, solutions, or any
// server-only imports.
import { ALL_LESSON_SOURCES } from "@/curriculum";
import { CHAPTERS } from "@/curriculum/chapters";

const chapterOrder = new Map(CHAPTERS.map((c) => [c.id, c.order]));

export interface LessonMeta {
  id: string;
  title: string;
  chapter: string;
  order: number;
  difficulty: number;
  concepts: string[];
  concept?: boolean;
}

export const LESSONS: LessonMeta[] = [...ALL_LESSON_SOURCES]
  .sort((a, b) => {
    const ca = chapterOrder.get(a.chapter) ?? 999;
    const cb = chapterOrder.get(b.chapter) ?? 999;
    if (ca !== cb) return ca - cb;
    return a.order - b.order;
  })
  .map((l) => ({
    id: l.id,
    title: l.title,
    chapter: l.chapter,
    order: l.order,
    difficulty: l.difficulty,
    concepts: l.concepts,
    concept: l.concept,
  }));

export { CHAPTERS };
