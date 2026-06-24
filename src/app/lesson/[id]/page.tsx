import { notFound } from "next/navigation";
import { adjacentLessons, getLesson } from "@/lib/lessons/registry";
import { CHAPTER_BY_ID } from "@/curriculum/chapters";
import { renderMarkdown } from "@/lib/markdown";
import { LessonWorkspace, LessonDTO } from "@/components/LessonWorkspace";

export function generateStaticParams() {
  return [];
}

export default function LessonPage({ params }: { params: { id: string } }) {
  const lesson = getLesson(params.id);
  if (!lesson) notFound();

  const { prev, next } = adjacentLessons(lesson.id);
  const chapter = CHAPTER_BY_ID.get(lesson.chapter);

  const dto: LessonDTO = {
    id: lesson.id,
    title: lesson.title,
    chapterId: lesson.chapter,
    chapterTitle: chapter?.title ?? lesson.chapter,
    difficulty: lesson.difficulty,
    concepts: lesson.concepts,
    briefHtml: renderMarkdown(lesson.brief),
    concept: lesson.concept ?? false,
    symbol: lesson.symbol,
    starter: lesson.starter,
    solution: lesson.solution,
    hints: lesson.hints,
    prev: prev ? { id: prev.id, title: prev.title } : null,
    next: next ? { id: next.id, title: next.title } : null,
  };

  return <LessonWorkspace lesson={dto} />;
}
